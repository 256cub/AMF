const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const A = require('../../shared/actions.js');

const root = path.join(__dirname, '..', '..');
const settingsFor = (...ids) => A.mergeSettings({enabled: Object.fromEntries(ids.map((id) => [id, true]))});

test('every action has a unique id and a known network', () => {
    const ids = A.ACTIONS.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length);
    const networks = new Set(A.NETWORKS.map((n) => n.id));
    for (const action of A.ACTIONS) assert.ok(networks.has(action.network), action.id);
});

test('task page paths are unique', () => {
    const paths = A.ACTIONS.filter((a) => a.path).map((a) => a.path);
    assert.equal(new Set(paths).size, paths.length);
});

test('every runnable action has a handler in a script the manifest loads', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    const scripts = manifest.content_scripts.flatMap((entry) => entry.js);
    for (const file of scripts) assert.ok(fs.existsSync(path.join(root, file)), 'missing ' + file);

    const source = scripts.filter((f) => f.startsWith('networks/')).map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
    for (const action of A.ACTIONS.filter(A.isRunnable)) {
        assert.match(source, new RegExp('AMF\\.handlers\\.' + action.id + '\\b'), 'no handler for ' + action.id);
    }
});

test('actionByUrl ignores host, query, trailing slash and case', () => {
    assert.equal(A.actionByUrl('https://addmefast.com/free_points/youtube_likes').id, 'yt_like');
    assert.equal(A.actionByUrl('https://www.addmefast.com/free_points/youtube_likes/?x=1').id, 'yt_like');
    assert.equal(A.actionByUrl('https://addmefast.com/Free_Points/Twitter').id, 'twitter_follow');
    assert.equal(A.actionByUrl('https://addmefast.com/'), null);
    assert.equal(A.actionByUrl('https://addmefast.com/free_points/unknown'), null);
});

test('nextAction walks the enabled actions round-robin', () => {
    const settings = settingsFor('yt_sub', 'reddit_like', 'twitch_follow');
    assert.equal(A.nextAction(null, settings).id, 'yt_sub');
    assert.equal(A.nextAction('yt_sub', settings).id, 'reddit_like');
    assert.equal(A.nextAction('reddit_like', settings).id, 'twitch_follow');
    assert.equal(A.nextAction('twitch_follow', settings).id, 'yt_sub');
    // Starting from a page that is not enabled still finds the next enabled one.
    assert.equal(A.nextAction('ig_like', settings).id, 'reddit_like');
});

test('nextAction returns the only enabled action, or null when nothing can run', () => {
    assert.equal(A.nextAction('yt_like', settingsFor('yt_like')).id, 'yt_like');
    assert.equal(A.nextAction(null, settingsFor()), null);
    // Unavailable actions can never be switched on.
    assert.equal(A.nextAction(null, settingsFor('telegram_follow', 'yt_view')), null);
});

test('actions without a built-in path only run once their page was discovered', () => {
    const settings = settingsFor('pinterest_follow');
    assert.equal(A.nextAction(null, settings), null);
    const discovered = {pinterest_follow: '/free_points/pinterest'};
    assert.equal(A.nextAction(null, settings, discovered).id, 'pinterest_follow');
    assert.equal(A.urlFor(A.getAction('pinterest_follow'), discovered), 'https://addmefast.com/free_points/pinterest');
    assert.equal(A.actionByUrl('https://addmefast.com/free_points/pinterest', discovered).id, 'pinterest_follow');
});

test('discoverPaths maps menu links to the right experimental actions', () => {
    const found = A.discoverPaths([
        'https://addmefast.com/free_points/youtube_likes',
        'https://addmefast.com/free_points/pinterest',
        'https://addmefast.com/free_points/pinterest_save',
        'https://addmefast.com/free_points/vkontakte_groups',
        '/free_points/vk_pages',
        'https://addmefast.com/free_points/telegram_subscribers',
        'https://addmefast.com/login',
        'not a url at all ://',
    ]);
    assert.deepEqual(found, {
        pinterest_follow: '/free_points/pinterest',
        pinterest_save: '/free_points/pinterest_save',
        vk_group: '/free_points/vkontakte_groups',
        vk_page: '/free_points/vk_pages',
    });
});

test('discoverPaths never reassigns a page that already belongs to an action', () => {
    assert.deepEqual(A.discoverPaths(A.ACTIONS.filter((a) => a.path).map((a) => A.BASE + a.path)), {});
});

test('mergeSettings fills defaults and clamps bad input', () => {
    const defaults = A.mergeSettings(undefined);
    assert.equal(defaults.max, 5);
    assert.equal(defaults.sessionLimit, 0);
    assert.ok(Object.values(defaults.enabled).every((v) => v === false));

    const odd = A.mergeSettings({max: '0', sessionLimit: '-4', enabled: {yt_like: 1, telegram_follow: true, bogus: true}});
    assert.equal(odd.max, 1);
    assert.equal(odd.sessionLimit, 0);
    assert.equal(odd.enabled.yt_like, true);
    assert.equal(odd.enabled.telegram_follow, false);
    assert.equal('bogus' in odd.enabled, false);

    assert.equal(A.mergeSettings({max: 'abc'}).max, 5);
    assert.equal(A.mergeSettings({max: 99999}).max, 500);
});

test('rand stays inside its inclusive bounds', () => {
    for (let i = 0; i < 500; i++) {
        const n = A.rand(3, 6);
        assert.ok(n >= 3 && n <= 6 && Number.isInteger(n));
    }
});
