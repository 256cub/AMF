/*
 * End-to-end test of the engine. Loads the unpacked extension into Chromium and replaces
 * addmefast.com and youtube.com with small local mocks, so no real site is contacted.
 *
 * It checks the whole loop (start from the popup, open task, act, close, credit, rotate,
 * session limit) and, just as important, that tabs the bot did not open are never touched.
 *
 *   npm run test:e2e
 *   CHROME_PATH=/path/to/chrome npm run test:e2e
 *   ALLOW_POPUPS=0 npm run test:e2e     keep Chromium's pop-up blocker on
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {chromium} = require('playwright-core');

const root = path.join(__dirname, '..', '..');

const amfPage = (pathname) => `<!doctype html><title>AddMeFast mock</title>
<nav>
  <a href="/free_points/youtube_subscribe">YouTube Subscribe</a>
  <a href="/free_points/youtube_likes">YouTube Likes</a>
  <a href="/free_points/pinterest">Pinterest Followers</a>
</nav>
<p>Points: <span id="points">0</span></p>
<div class="btn3">${pathname.includes('subscribe') ? 'Subscribe' : 'Like'}</div>
<script>
  let n = 0, points = 0;
  document.querySelector('.btn3').addEventListener('click', () => {
    const kind = location.pathname.split('/').pop();
    const w = window.open('https://www.youtube.com/watch?v=' + kind + '_' + (++n), 'amftask', 'width=700,height=500');
    if (!w) { fetch('/__event?type=blocked'); return; }
    const timer = setInterval(() => {
      if (!w.closed) return;
      clearInterval(timer);
      document.getElementById('points').textContent = ++points;
      fetch('/__event?type=credit&kind=' + kind);
    }, 300);
  });
</script>`;

const youtubePage = `<!doctype html><title>YouTube mock</title>
<ytd-subscribe-button-renderer>
  <button id="sub" aria-label="Subscribe to mock.">Subscribe</button>
</ytd-subscribe-button-renderer>
<like-button-view-model>
  <button id="like" aria-pressed="false" aria-label="like this video along with 3 other people">Like</button>
</like-button-view-model>
<script>
  const note = (what) => fetch('/__event?type=click&what=' + what + '&v=' + new URLSearchParams(location.search).get('v'));
  document.getElementById('sub').addEventListener('click', (e) => { e.target.textContent = 'Subscribed'; note('sub'); });
  document.getElementById('like').addEventListener('click', (e) => { e.target.setAttribute('aria-pressed', 'true'); note('like'); });
</script>`;

async function main() {
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'amf-e2e-'));
    const args = ['--headless=new', `--disable-extensions-except=${root}`, `--load-extension=${root}`];
    if (process.env.ALLOW_POPUPS !== '0') args.push('--disable-popup-blocking');

    const context = await chromium.launchPersistentContext(profile, {
        headless: false, // the flag above selects the new headless mode, which supports extensions
        executablePath: process.env.CHROME_PATH || undefined,
        args,
    });

    const events = [];
    await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (!/^https?:$/.test(url.protocol)) return route.continue(); // the extension's own pages
        if (url.pathname === '/__event') {
            events.push(Object.fromEntries(url.searchParams));
            return route.fulfill({status: 204, body: ''});
        }
        if (url.hostname.endsWith('addmefast.com')) {
            return route.fulfill({contentType: 'text/html', body: amfPage(url.pathname)});
        }
        if (url.hostname.endsWith('youtube.com')) {
            return route.fulfill({contentType: 'text/html', body: youtubePage});
        }
        return route.fulfill({contentType: 'text/html', body: '<!doctype html><title>other</title>'});
    });

    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const extensionId = new URL(worker.url()).host;

    // Tabs that belong to "the user": the bot must leave both of them exactly as they are.
    const ownYoutube = await context.newPage();
    await ownYoutube.goto('https://www.youtube.com/watch?v=mine');
    const ownAmf = await context.newPage();
    await ownAmf.goto('https://example.org/');

    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
    await popup.waitForSelector('#networks input[data-action="yt_sub"]');
    const getState = () => popup.evaluate(() => chrome.runtime.sendMessage({type: 'getState'}));

    assert.equal(await popup.locator('input[data-action="telegram_follow"]').isDisabled(), true, 'unavailable actions are disabled');
    assert.equal((await getState()).runtime.running, false);

    // Start with nothing selected: refused with a message, nothing opens.
    await popup.click('#toggle');
    await popup.waitForFunction(() => /Select at least one action/.test(document.getElementById('status-text').textContent));

    await popup.check('input[data-action="yt_sub"]');
    await popup.check('input[data-action="yt_like"]');
    await popup.check('input[data-action="pinterest_follow"]');
    await popup.fill('#max', '2');
    await popup.fill('#session-limit', '3');
    await popup.locator('#session-limit').blur();
    await popup.click('#toggle');

    const deadline = Date.now() + 150000;
    let state;
    for (;;) {
        await new Promise((r) => setTimeout(r, 2000));
        state = await getState();
        const done = state.runtime.session.tasks >= 3 && !state.runtime.running;
        if (done) break;
        if (events.some((e) => e.type === 'blocked')) throw new Error('the task window was blocked by the pop-up blocker');
        if (Date.now() > deadline) {
            throw new Error('timed out. status: ' + JSON.stringify(state.runtime.status) + ' events: ' + JSON.stringify(events)
                + ' log: ' + JSON.stringify(state.log.map((l) => l.text)));
        }
    }

    const clicks = events.filter((e) => e.type === 'click');
    const credits = events.filter((e) => e.type === 'credit');

    assert.deepEqual(clicks.map((c) => c.what), ['sub', 'sub', 'like'], 'two subscribes (max per type), then it moves on to likes');
    assert.equal(credits.length, 3, 'every task window was closed so AddMeFast could credit it');
    assert.ok(clicks.every((c) => c.v !== 'mine'), "the user's own YouTube tab was never clicked");
    assert.equal(await ownYoutube.locator('#sub').textContent(), 'Subscribe', "the user's own YouTube tab is untouched");
    assert.equal(ownYoutube.isClosed(), false);
    assert.equal(ownAmf.url(), 'https://example.org/', 'unrelated tabs are not redirected');

    assert.deepEqual(state.runtime.session, {tasks: 3, done: 3, already: 0, failed: 0});
    assert.equal(state.runtime.status.text, 'Session limit reached');
    assert.equal(state.stats.yt_sub.done, 2);
    assert.equal(state.stats.yt_like.done, 1);
    assert.equal(state.discovered.pinterest_follow, '/free_points/pinterest', 'menu link was discovered');
    assert.equal(state.settings.max, 2);

    const taskTabs = context.pages().filter((p) => /watch\?v=youtube_/.test(p.url()));
    assert.equal(taskTabs.length, 0, 'no task tab is left open');

    // Second run: Stop while a task window is open closes it and halts the controller.
    await popup.fill('#session-limit', '0');
    await popup.locator('#session-limit').blur();
    await popup.click('#toggle');
    const before = events.length;
    const taskPage = await context.waitForEvent('page', {predicate: (p) => p.url().includes('youtube.com') || p.url() === 'about:blank', timeout: 60000});
    await popup.click('#toggle');
    await popup.waitForFunction(() => document.getElementById('toggle').textContent === 'Start');
    await new Promise((r) => setTimeout(r, 1500));
    assert.equal(taskPage.isClosed(), true, 'stopping closes the open task tab');
    assert.equal((await getState()).runtime.running, false);
    const tasksAtStop = (await getState()).runtime.session.tasks;
    await new Promise((r) => setTimeout(r, 12000));
    assert.equal((await getState()).runtime.session.tasks, tasksAtStop, 'no new task starts after Stop');
    assert.ok(events.length - before <= 2, 'at most the interrupted task produced events');

    await context.close();
    fs.rmSync(profile, {recursive: true, force: true});
    console.log('e2e passed: ' + clicks.length + ' tasks, ' + credits.length + ' credits, bystander tabs untouched, stop works');
}

main().catch((e) => {
    console.error('e2e FAILED:', e && e.message ? e.message : e);
    process.exit(1);
});
