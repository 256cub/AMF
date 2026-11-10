/*
 * Checks the network handlers against the real, public pages (signed out).
 * Clicks are replaced by a recorder, so nothing is liked, followed or joined.
 * It proves that each handler still finds the right control; it cannot prove that a
 * signed-in session looks the same, and it needs network access.
 *
 *   npm run test:live                 all cases
 *   npm run test:live -- reddit       only cases whose name contains "reddit"
 *   CHROME_PATH=/path/to/chrome       use a specific browser binary
 */
const path = require('node:path');
const {chromium} = require('playwright-core');

const root = path.join(__dirname, '..', '..');
const file = (rel) => path.join(root, rel);

// [action, network script, url, pattern the clicked element must match]
const CASES = [
    ['yt_sub', 'youtube', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', /aria-label="Subscribe/],
    ['yt_sub', 'youtube', 'https://www.youtube.com/@YouTube', /aria-label="Subscribe/],
    ['yt_like', 'youtube', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', /aria-label="like this video/],
    ['reddit_follow', 'reddit', 'https://www.reddit.com/r/AskReddit/', /join-btn/],
    ['reddit_like', 'reddit', 'https://www.reddit.com/r/crashbandicoot/comments/1b0bq3r/', /upvote/],
    ['twitch_follow', 'twitch', 'https://www.twitch.tv/twitch', /data-a-target="follow-button"/],
    ['sc_like', 'soundcloud', 'https://soundcloud.com/forss/flickermood', /sc-button-like.*sc-button-medium/],
    ['sc_follow', 'soundcloud', 'https://soundcloud.com/forss', /sc-button-follow/],
    ['tiktok_follow', 'tiktok', 'https://www.tiktok.com/@tiktok', /aria-label="Follow TikTok"/],
    ['ig_follow', 'instagram', 'https://www.instagram.com/instagram/', />Follow$/],
    ['twitter_follow', 'twitter', 'https://x.com/intent/follow?screen_name=X', />Follow$/],
    ['twitter_like', 'twitter', 'https://x.com/vercel/status/1683920951807971329', /aria-label="[^"]*Like"/],
    ['coinmarketcap_watch', 'coinmarketcap', 'https://coinmarketcap.com/currencies/bitcoin/', /watchlist-star/],
    ['reverbnation_follow', 'reverbnation', 'https://www.reverbnation.com/imaginedragons', /data-fan-action="add"/],
    ['pinterest_follow', 'pinterest', 'https://www.pinterest.com/pinterest/', /aria-label="Follow"/],
    ['vk_group', 'vk', 'https://vk.com/vk', /group-subscribe-button/],
    ['ok_follow', 'ok', 'https://ok.ru/ok', /aria-label="Subscribe"/],
];

async function runCase(context, [action, network, url, expected]) {
    const page = await context.newPage();
    try {
        await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 45000});
        // Some sites bounce through a redirect or a JS check first; inject once the page has settled.
        for (let attempt = 1; ; attempt++) {
            await page.waitForTimeout(4000);
            try {
                for (const script of ['shared/actions.js', 'content/dom.js', 'networks/' + network + '.js']) {
                    await page.addScriptTag({path: file(script)});
                }
                break;
            } catch (e) {
                if (attempt >= 3) throw e;
            }
        }
        const outcome = await page.evaluate(async (id) => {
            const clicks = [];
            const describe = (el) => {
                const clone = el.cloneNode(false);
                return clone.outerHTML.replace(/<\/[^>]+>$/, '') + '>' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30);
            };
            window.AMF.dom.click = (el) => {
                clicks.push(describe(el));
                return true;
            };
            const result = await window.AMF.handlers[id]();
            return {result, clicks};
        }, action);

        const clicked = outcome.clicks[0] || '';
        const ok = outcome.result.status === 'done' && expected.test(clicked);
        return {ok, line: `${action} @ ${url}\n      ${outcome.result.status} ${outcome.result.detail || ''}\n      ${clicked.slice(0, 220) || '(nothing clicked)'}`};
    } catch (e) {
        return {ok: false, line: `${action} @ ${url}\n      ERROR ${String(e).slice(0, 200)}`};
    } finally {
        await page.close();
    }
}

(async () => {
    const only = process.argv[2];
    const cases = CASES.filter((c) => !only || c[0].includes(only) || c[1].includes(only));
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_PATH || undefined,
        args: ['--headless=new', '--disable-blink-features=AutomationControlled'],
    });
    const context = await browser.newContext({
        locale: 'en-US',
        viewport: {width: 1366, height: 900},
        bypassCSP: true,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    });

    const results = await Promise.all(cases.map((c) => runCase(context, c)));
    await browser.close();

    for (const r of results) console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.line);
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} passed`);
    process.exit(failed ? 1 : 0);
})();
