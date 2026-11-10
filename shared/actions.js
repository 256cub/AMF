/*
 * Single source of truth for every network and action the extension knows about.
 * Loaded by the service worker (importScripts), the content scripts, the popup and the tests.
 *
 * status:
 *   stable        - task page URL is known and the action is supported
 *   experimental  - implemented but not confirmed against a live AddMeFast account
 *   unavailable   - listed for visibility only, cannot be automated (see `note`)
 *
 * path:     task page on addmefast.com. When it is null the controller looks the page up
 *           in the AddMeFast menu with `discover` (a test on the last URL segment).
 */
(function (root) {
    'use strict';

    const BASE = 'https://addmefast.com';

    const NETWORKS = [
        {id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com'},
        {id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com'},
        {id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com'},
        {id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com'},
        {id: 'twitter', name: 'X / Twitter', url: 'https://x.com'},
        {id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com'},
        {id: 'soundcloud', name: 'SoundCloud', url: 'https://soundcloud.com'},
        {id: 'twitch', name: 'Twitch', url: 'https://www.twitch.tv'},
        {id: 'coinmarketcap', name: 'CoinMarketCap', url: 'https://coinmarketcap.com'},
        {id: 'likee', name: 'Likee', url: 'https://likee.video'},
        {id: 'reverbnation', name: 'ReverbNation', url: 'https://www.reverbnation.com'},
        {id: 'pinterest', name: 'Pinterest', url: 'https://www.pinterest.com'},
        {id: 'vk', name: 'VK', url: 'https://vk.com'},
        {id: 'ok', name: 'OK.ru', url: 'https://ok.ru'},
        {id: 'telegram', name: 'Telegram', url: 'https://web.telegram.org'},
        {id: 'website', name: 'Website', url: BASE + '/websites'},
    ];

    const has = (...words) => (segment) => words.every((w) => (w instanceof RegExp ? w.test(segment) : segment.includes(w)));

    const ACTIONS = [
        {id: 'yt_sub', network: 'youtube', label: 'Subscribe', path: '/free_points/youtube_subscribe', status: 'stable'},
        {id: 'yt_like', network: 'youtube', label: 'Like', path: '/free_points/youtube_likes', status: 'stable'},
        {id: 'yt_view', network: 'youtube', label: 'Views', path: null, status: 'unavailable', note: 'AddMeFast asks for a captcha on every view'},

        {id: 'fb_page_like', network: 'facebook', label: 'Page like', path: '/free_points/facebook_likes', status: 'stable'},
        {id: 'fb_follow', network: 'facebook', label: 'Follow', path: '/free_points/facebook_subscribes', status: 'stable'},
        {id: 'fb_post_like', network: 'facebook', label: 'Post like', path: '/free_points/facebook_post_like', status: 'stable'},
        {id: 'fb_share', network: 'facebook', label: 'Share', path: '/free_points/facebook_share', status: 'stable'},
        {id: 'fb_post_share', network: 'facebook', label: 'Post share', path: '/free_points/facebook_post_share', status: 'stable'},

        {id: 'ig_follow', network: 'instagram', label: 'Follow', path: '/free_points/instagram', status: 'stable'},
        {id: 'ig_like', network: 'instagram', label: 'Like', path: '/free_points/instagram_likes', status: 'stable'},

        {id: 'tiktok_follow', network: 'tiktok', label: 'Follow', path: '/free_points/tiktok_followers', status: 'stable'},
        {id: 'tiktok_like', network: 'tiktok', label: 'Like', path: '/free_points/tiktok_video_likes', status: 'stable'},

        {id: 'twitter_follow', network: 'twitter', label: 'Follow', path: '/free_points/twitter', status: 'stable'},
        {id: 'twitter_like', network: 'twitter', label: 'Like', path: '/free_points/twitter_likes', status: 'stable'},
        {id: 'twitter_retweet', network: 'twitter', label: 'Repost', path: '/free_points/twitter_retweets', status: 'stable'},
        {id: 'twitter_tweet', network: 'twitter', label: 'Post', path: '/free_points/twitter_tweets', status: 'stable'},

        {id: 'reddit_follow', network: 'reddit', label: 'Join', path: '/free_points/reddit_members', status: 'stable'},
        {id: 'reddit_like', network: 'reddit', label: 'Upvote', path: '/free_points/reddit_upvotes', status: 'stable'},

        {id: 'sc_follow', network: 'soundcloud', label: 'Follow', path: '/free_points/soundcloud_follow', status: 'stable'},
        {id: 'sc_like', network: 'soundcloud', label: 'Like', path: '/free_points/soundcloud_likes', status: 'stable'},
        {id: 'sc_play', network: 'soundcloud', label: 'Plays', path: null, status: 'unavailable', note: 'AddMeFast asks for a captcha on every play'},

        {id: 'twitch_follow', network: 'twitch', label: 'Follow', path: '/free_points/twitch_followers', status: 'stable'},
        {id: 'coinmarketcap_watch', network: 'coinmarketcap', label: 'Watchlist', path: '/free_points/coinmarketcap_watchlist', status: 'stable'},
        {id: 'likee_follow', network: 'likee', label: 'Follow', path: '/free_points/likee_followers', status: 'stable'},
        {id: 'reverbnation_follow', network: 'reverbnation', label: 'Fan', path: '/free_points/reverbnation_fan', status: 'stable'},

        {id: 'pinterest_follow', network: 'pinterest', label: 'Follow', path: null, status: 'experimental', discover: has('pinterest', /^(?!.*(save|repin|pins?$|like))/)},
        {id: 'pinterest_save', network: 'pinterest', label: 'Save', path: null, status: 'experimental', discover: has('pinterest', /save|repin/)},
        {id: 'vk_group', network: 'vk', label: 'Group', path: null, status: 'experimental', discover: has(/^vk|vkontakte/, 'group')},
        {id: 'vk_page', network: 'vk', label: 'Page', path: null, status: 'experimental', discover: has(/^vk|vkontakte/, 'page')},
        {id: 'ok_follow', network: 'ok', label: 'Group join', path: '/free_points/ok_group_join', status: 'experimental'},

        {id: 'telegram_follow', network: 'telegram', label: 'Channel', path: null, status: 'unavailable', note: 'Joining needs the Telegram app or a signed-in Telegram Web session that a web page cannot drive'},
        {id: 'website_view', network: 'website', label: 'Hits', path: null, status: 'unavailable', note: 'Not automated'},
    ];

    const DEFAULT_SETTINGS = Object.freeze({
        enabled: {},
        max: 5,
        sessionLimit: 0,
    });

    const byId = new Map(ACTIONS.map((a) => [a.id, a]));

    function getAction(id) {
        return byId.get(id) || null;
    }

    function isRunnable(action) {
        return !!action && action.status !== 'unavailable';
    }

    /** Path of the task page for an action, using menu-discovered paths when the action has none built in. */
    function pathFor(action, discovered) {
        if (!action) return null;
        return action.path || (discovered && discovered[action.id]) || null;
    }

    function urlFor(action, discovered) {
        const path = pathFor(action, discovered);
        return path ? BASE + path : null;
    }

    function normalizePath(pathname) {
        return String(pathname || '').replace(/\/+$/, '').toLowerCase();
    }

    /** Which action does this AddMeFast URL belong to? */
    function actionByUrl(url, discovered) {
        let pathname;
        try {
            pathname = normalizePath(new URL(url, BASE).pathname);
        } catch (e) {
            return null;
        }
        for (const action of ACTIONS) {
            const path = pathFor(action, discovered);
            if (path && normalizePath(path) === pathname) return action;
        }
        return null;
    }

    /** Ids the user switched on that can actually run right now, in registry order. */
    function runnableIds(settings, discovered) {
        const enabled = (settings && settings.enabled) || {};
        return ACTIONS
            .filter((a) => enabled[a.id] && isRunnable(a) && pathFor(a, discovered))
            .map((a) => a.id);
    }

    /** Next action after `currentId` in round-robin order, or null when nothing is runnable. */
    function nextAction(currentId, settings, discovered) {
        const ids = runnableIds(settings, discovered);
        if (!ids.length) return null;
        const order = ACTIONS.map((a) => a.id);
        const start = order.indexOf(currentId);
        for (let step = 1; step <= order.length; step++) {
            const id = order[(start + step + order.length) % order.length];
            if (ids.includes(id)) return getAction(id);
        }
        return null;
    }

    /** Match menu links against the actions that have no built-in path. Returns {actionId: path}. */
    function discoverPaths(hrefs) {
        const found = {};
        const known = new Set(ACTIONS.filter((a) => a.path).map((a) => normalizePath(a.path)));
        for (const href of hrefs || []) {
            let pathname;
            try {
                pathname = normalizePath(new URL(href, BASE).pathname);
            } catch (e) {
                continue;
            }
            const match = /^\/free_points\/([a-z0-9_]+)$/.exec(pathname);
            if (!match || known.has(pathname)) continue;
            for (const action of ACTIONS) {
                if (action.path || !action.discover || found[action.id]) continue;
                if (action.discover(match[1])) {
                    found[action.id] = pathname;
                    break;
                }
            }
        }
        return found;
    }

    function mergeSettings(saved) {
        const out = {enabled: {}, max: DEFAULT_SETTINGS.max, sessionLimit: DEFAULT_SETTINGS.sessionLimit};
        const src = saved || {};
        for (const action of ACTIONS) {
            out.enabled[action.id] = isRunnable(action) && !!(src.enabled && src.enabled[action.id]);
        }
        const max = parseInt(src.max, 10);
        if (Number.isFinite(max)) out.max = Math.min(Math.max(max, 1), 500);
        const limit = parseInt(src.sessionLimit, 10);
        if (Number.isFinite(limit)) out.sessionLimit = Math.min(Math.max(limit, 0), 100000);
        return out;
    }

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const api = {
        BASE,
        NETWORKS,
        ACTIONS,
        DEFAULT_SETTINGS,
        getAction,
        isRunnable,
        pathFor,
        urlFor,
        actionByUrl,
        runnableIds,
        nextAction,
        discoverPaths,
        mergeSettings,
        rand,
    };

    root.AMF = Object.assign(root.AMF || {}, api);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
