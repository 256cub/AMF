const _MAX_LOADING_WAIT_TIME = 30;
const _TIMEOUT_IN_SECS = 60;
const _MAX_TYPE = 26;

const _ACTION_TYPE_TIKTOK_LIKE = 0;
const _ACTION_TYPE_TIKTOK_FOLLOW = 1;

const _ACTION_TYPE_INSTAGRAM_LIKE = 2;
const _ACTION_TYPE_INSTAGRAM_FOLLOW = 3;

const _ACTION_TYPE_FACEBOOK_PAGE_LIKE = 4;
const _ACTION_TYPE_FACEBOOK_SHARE = 5;
const _ACTION_TYPE_FACEBOOK_FOLLOW = 6;
const _ACTION_TYPE_FACEBOOK_POST_LIKE = 7;
const _ACTION_TYPE_FACEBOOK_POST_SHARE = 8;

const _ACTION_TYPE_TWITTER_FOLLOW = 9;
const _ACTION_TYPE_TWITTER_TWEET = 10;
const _ACTION_TYPE_TWITTER_RETWEET = 11;
const _ACTION_TYPE_TWITTER_LIKE = 12;

const _ACTION_TYPE_YT_SUB = 13;
const _ACTION_TYPE_YT_LIKE = 14;

const _ACTION_TYPE_SC_FOLLOW = 15;
const _ACTION_TYPE_SC_LIKE = 16;

const _ACTION_TYPE_REDDIT_FOLLOW = 17;
const _ACTION_TYPE_REDDIT_LIKE = 18;

const _ACTION_TYPE_COINMARKETCAT_WATCH = 19;

const _ACTION_TYPE_TELEGRAM_FOLLOW = 20;

const _ACTION_TYPE_TWITCH_FOLLOW = 21;

const _ACTION_TYPE_WEBSITE_VIEW = 22;

const _ACTION_TYPE_LIKEE_FOLLOW = 23;

const _ACTION_TYPE_OK_FOLLOW = 24;

const _ACTION_TYPE_REVERBNATION_FOLLOW = 25;


const _TIKTOK_FOLLOW = "https://addmefast.com/free_points/tiktok_followers";
const _TIKTOK_LIKE = "https://addmefast.com/free_points/tiktok_video_likes";

const _INSTAGRAM_FOLLOW = "https://addmefast.com/free_points/instagram";
const _INSTAGRAM_LIKES = "https://addmefast.com/free_points/instagram_likes";

const _FACEBOOK_PAGE_LIKE = "https://addmefast.com/free_points/facebook_likes";
const _FACEBOOK_SHARE = "https://addmefast.com/free_points/facebook_share";
const _FACEBOOK_FOLLOW = "https://addmefast.com/free_points/facebook_subscribes";
const _FACEBOOK_POST_LIKE = "https://addmefast.com/free_points/facebook_post_like";
const _FACEBOOK_POST_SHARE = "https://addmefast.com/free_points/facebook_post_share";

const _TWITTER_FOLLOW = "https://addmefast.com/free_points/twitter";
const _TWITTER_TWEET = "https://addmefast.com/free_points/twitter_tweets";
const _TWITTER_RETWEET = "https://addmefast.com/free_points/twitter_retweets";
const _TWITTER_LIKE = "https://addmefast.com/free_points/twitter_likes";

const _YT_SUB = "https://addmefast.com/free_points/youtube_subscribe";
const _YT_LIKE = "https://addmefast.com/free_points/youtube_likes";

const _SC_FOLLOW = "https://addmefast.com/free_points/soundcloud_follow";
const _SC_LIKE = "https://addmefast.com/free_points/soundcloud_likes";

const _REDDIT_FOLLOW = "https://addmefast.com/free_points/reddit_members";
const _REDDIT_LIKE = "https://addmefast.com/free_points/reddit_upvotes";

const _COINMARKETCAP_WATCH = "https://addmefast.com/free_points/coinmarketcap_watchlist";

const _TELEGRAM_FOLLOW = "https://addmefast.com/free_points/telegram_subscribers";

const _TWITCH_FOLLOW = "https://addmefast.com/free_points/twitch_followers";

const _WEBSITE_VIEW = "https://addmefast.com/websites";

const _LIKEE_FOLLOW = "https://addmefast.com/free_points/likee_followers";

const _OK_FOLLOW = "https://addmefast.com/free_points/ok_group_join";

const _REVERBNATION_FOLLOW = "https://addmefast.com/free_points/reverbnation_fan";

counter = {
    'reddit': {
        total: 0,
        good: 0,
        bad: 0,
    }
}


tick_count = 0;
first = true;

let CurActionUrl = "";

const config = {
    enable: 0,
    max: 0,
    actionType: 0,
};

let tab_id = 0;
let opened_tab_id = 0;
let wait_time = 5;

const _STATE_IDLE = 0;
const _STATE_WAIT = 1;
const _STATE_TASK_STARTED = 2;
const _STATE_WAIT_TO_CLOSE = 3;

let state = 0;

let click_count = 0;

function clog(s) {
    chrome.runtime.sendMessage({action: "log", log: s});
}

function generateRandom(min = 0, max = 100) {

    // find diff
    let difference = max - min;

    // generate random number
    let rand = Math.random();

    // multiply with difference
    rand = Math.floor( rand * difference);

    // add with min value
    rand = rand + min;

    return rand;
}

const _ENABLE_LIST = [
    true, true, true, true, true,
    true, true, true, true, true,
    true, true, true, true, true,
    true, true, true, false, true,
    false, true, true, true, true,
    true, true, true, true, true,
    true, true, true, true, true,
    true];

function nextActionType() {

    // get next enable type
    let i = 0;
    let j = config.actionType;
    let cat = -1;

    while ((i < _MAX_TYPE) && (cat === -1)) {

        i++;
        if (j < _MAX_TYPE - 1) {
            j++
        } else {
            j = 0;
        }

        if (_ENABLE_LIST[j]) {
            cat = j;
        }
    }

    config.actionType = cat;
    switch (cat) {
        case _ACTION_TYPE_TIKTOK_LIKE :
            CurActionUrl = _TIKTOK_LIKE;
            break;

        case _ACTION_TYPE_TIKTOK_FOLLOW :
            CurActionUrl = _TIKTOK_FOLLOW;
            break;

        case _ACTION_TYPE_INSTAGRAM_LIKE :
            CurActionUrl = _INSTAGRAM_LIKES;
            break;

        case _ACTION_TYPE_INSTAGRAM_FOLLOW :
            CurActionUrl = _INSTAGRAM_FOLLOW;
            break;

        case _ACTION_TYPE_FACEBOOK_PAGE_LIKE :
            CurActionUrl = _FACEBOOK_PAGE_LIKE;
            break;

        case _ACTION_TYPE_FACEBOOK_SHARE :
            CurActionUrl = _FACEBOOK_SHARE;
            break;

        case _ACTION_TYPE_FACEBOOK_FOLLOW :
            CurActionUrl = _FACEBOOK_FOLLOW;
            break;

        case _ACTION_TYPE_FACEBOOK_POST_LIKE :
            CurActionUrl = _FACEBOOK_POST_LIKE;
            break;

        case _ACTION_TYPE_FACEBOOK_POST_SHARE :
            CurActionUrl = _FACEBOOK_POST_SHARE;
            break;

        case _ACTION_TYPE_TWITTER_FOLLOW :
            CurActionUrl = _TWITTER_FOLLOW;
            break;

        case _ACTION_TYPE_TWITTER_TWEET :
            CurActionUrl = _TWITTER_TWEET;
            break;

        case _ACTION_TYPE_TWITTER_RETWEET :
            CurActionUrl = _TWITTER_RETWEET;
            break;

        case _ACTION_TYPE_TWITTER_LIKE :
            CurActionUrl = _TWITTER_LIKE;
            break;

        case _ACTION_TYPE_YT_SUB :
            CurActionUrl = _YT_SUB;
            break;

        case _ACTION_TYPE_YT_LIKE :
            CurActionUrl = _YT_LIKE;
            break;

        case _ACTION_TYPE_SC_FOLLOW :
            CurActionUrl = _SC_FOLLOW;
            break;

        case _ACTION_TYPE_SC_LIKE :
            CurActionUrl = _SC_LIKE;
            break;

        case _ACTION_TYPE_REDDIT_FOLLOW :
            CurActionUrl = _REDDIT_FOLLOW;
            break;

        case _ACTION_TYPE_REDDIT_LIKE :
            CurActionUrl = _REDDIT_LIKE;
            break;

        case _ACTION_TYPE_COINMARKETCAT_WATCH :
            CurActionUrl = _COINMARKETCAP_WATCH;
            break;

        case _ACTION_TYPE_TELEGRAM_FOLLOW :
            CurActionUrl = _TELEGRAM_FOLLOW;
            break;

        case _ACTION_TYPE_TWITCH_FOLLOW :
            CurActionUrl = _TWITCH_FOLLOW;
            break;

        case _ACTION_TYPE_WEBSITE_VIEW :
            CurActionUrl = _WEBSITE_VIEW;
            break;

        case _ACTION_TYPE_LIKEE_FOLLOW :
            CurActionUrl = _LIKEE_FOLLOW;
            break;

        case _ACTION_TYPE_OK_FOLLOW :
            CurActionUrl = _OK_FOLLOW;
            break;

        case _ACTION_TYPE_REVERBNATION_FOLLOW :
            CurActionUrl = _REVERBNATION_FOLLOW;
            break;

        default :
            CurActionUrl = "";
    }
}

function urlToActionType(current_url) {

    if (current_url === _TIKTOK_LIKE) return _ACTION_TYPE_TIKTOK_LIKE;
    if (current_url === _TIKTOK_FOLLOW) return _ACTION_TYPE_TIKTOK_FOLLOW;

    if (current_url === _INSTAGRAM_LIKES) return _ACTION_TYPE_INSTAGRAM_LIKE;
    if (current_url === _INSTAGRAM_FOLLOW) return _ACTION_TYPE_INSTAGRAM_FOLLOW;

    if (current_url === _FACEBOOK_PAGE_LIKE) return _ACTION_TYPE_FACEBOOK_PAGE_LIKE;
    if (current_url === _FACEBOOK_SHARE) return _ACTION_TYPE_FACEBOOK_SHARE;
    if (current_url === _FACEBOOK_FOLLOW) return _ACTION_TYPE_FACEBOOK_FOLLOW;
    if (current_url === _FACEBOOK_POST_LIKE) return _ACTION_TYPE_FACEBOOK_POST_LIKE;
    if (current_url === _FACEBOOK_POST_SHARE) return _ACTION_TYPE_FACEBOOK_POST_SHARE;

    if (current_url === _TWITTER_FOLLOW) return _ACTION_TYPE_TWITTER_FOLLOW;
    if (current_url === _TWITTER_TWEET) return _ACTION_TYPE_TWITTER_TWEET;
    if (current_url === _TWITTER_RETWEET) return _ACTION_TYPE_TWITTER_RETWEET;
    if (current_url === _TWITTER_LIKE) return _ACTION_TYPE_TWITTER_LIKE;

    if (current_url === _YT_SUB) return _ACTION_TYPE_YT_SUB;
    if (current_url === _YT_LIKE) return _ACTION_TYPE_YT_LIKE;

    if (current_url === _SC_FOLLOW) return _ACTION_TYPE_SC_FOLLOW;
    if (current_url === _SC_LIKE) return _ACTION_TYPE_SC_LIKE;

    if (current_url === _REDDIT_FOLLOW) return _ACTION_TYPE_REDDIT_FOLLOW;
    if (current_url === _REDDIT_LIKE) return _ACTION_TYPE_REDDIT_LIKE;

    if (current_url === _COINMARKETCAP_WATCH) return _ACTION_TYPE_COINMARKETCAT_WATCH;

    if (current_url === _TELEGRAM_FOLLOW) return _ACTION_TYPE_TELEGRAM_FOLLOW;

    if (current_url === _TWITCH_FOLLOW) return _ACTION_TYPE_TWITCH_FOLLOW;

    if (current_url === _WEBSITE_VIEW) return _ACTION_TYPE_WEBSITE_VIEW;

    if (current_url === _LIKEE_FOLLOW) return _ACTION_TYPE_LIKEE_FOLLOW;

    if (current_url === _OK_FOLLOW) return _ACTION_TYPE_OK_FOLLOW;

    if (current_url === _REVERBNATION_FOLLOW) return _ACTION_TYPE_REVERBNATION_FOLLOW;

    return -1;
}

const simulateMouseEvent = function (element, eventName, position_x, position_y) {
    element.dispatchEvent(new MouseEvent(eventName, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: position_x,
        clientY: position_y,
        button: 0
    }));
};

function click(btn) {
    const box = btn.getBoundingClientRect(),
        position_x = box.left + (box.right - box.left) / 2,
        position_y = box.top + (box.bottom - box.top) / 2;

    btn.focus();
    simulateMouseEvent(btn, "mousemove", position_x, position_y);
    simulateMouseEvent(btn, "mousedown", position_x, position_y);
    setTimeout(function () {
        simulateMouseEvent(btn, "click", position_x, position_y);
        simulateMouseEvent(btn, "mouseup", position_x, position_y);
    }, 200);
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        let tick_count;

        if (request.action === "set") {
            config.enable = request.enable;
            config.max = request.max;

            _ENABLE_LIST[0] = request.tiktok_like;
            _ENABLE_LIST[1] = request.tiktok_follow;

            _ENABLE_LIST[2] = request.ig_like;
            _ENABLE_LIST[3] = request.ig_follow;

            _ENABLE_LIST[4] = request.fb_page_like;
            _ENABLE_LIST[5] = request.fb_share;
            _ENABLE_LIST[6] = request.fb_follow;
            _ENABLE_LIST[7] = request.fb_post_like;
            _ENABLE_LIST[8] = request.fb_post_share;

            _ENABLE_LIST[9] = request.twitter_follow;
            _ENABLE_LIST[10] = request.twitter_tweet;
            _ENABLE_LIST[11] = request.twitter_retweet;
            _ENABLE_LIST[12] = request.twitter_like;

            _ENABLE_LIST[13] = request.yt_sub;
            _ENABLE_LIST[14] = request.yt_like;

            _ENABLE_LIST[15] = request.sc_follow;
            _ENABLE_LIST[16] = request.sc_like;

            _ENABLE_LIST[17] = request.reddit_follow;
            _ENABLE_LIST[18] = request.reddit_like;

            _ENABLE_LIST[19] = request.coinmarketcap_watch;

            _ENABLE_LIST[20] = request.telegram_follow;

            _ENABLE_LIST[21] = request.twitch_follow;

            _ENABLE_LIST[22] = request.website_view;

            _ENABLE_LIST[23] = request.likee_follow;

            _ENABLE_LIST[24] = request.ok_follow;

            _ENABLE_LIST[25] = request.reverbnation_follow;

            if (config.enable) {
                window.location.href = "https://www.addmefast.com";
                return;
            }

            tick_count = 0;
        }

        if (request.action === "opened") {
            opened_tab_id = request.tabid;
            if (state === _STATE_TASK_STARTED) {
                wait_time = generateRandom(200, 300);
            }
        }

        if (request.action === "closed") {
            if (opened_tab_id === request.tabid) {
                opened_tab_id = 0;
                state = _STATE_IDLE;
                wait_time = generateRandom(3, 5);
            }
        }

    });

function removeErrorLike() {
    const div = document.querySelector("div.error_like");
    if (div) {
        div.parentNode.removeChild(div);
        wait_time = generateRandom(10, 20);
    }
}

function checkReloadButton() {
    const div = document.querySelector('div.ui-dialog[aria-labelledby="ui-dialog-title-timeout"]');
    if (!div) {
        return;
    }

    const btn = document.querySelector('input[name="reload"]');
    if (btn) {
        wait_time = generateRandom(20, 30);
        clog("Page Reloaded");
        btn.click();
    }
}

let loading_tick_count = 0;

function isLoading() {
    const div = document.querySelector("div#loading-indicator-site-links-list-overlay");
    if (div) {
        loading_tick_count++;
        return true;
    } else {
        loading_tick_count = 0;
        return false;
    }
}

const readyStateCheckInterval = setInterval(function () {

    if (document.readyState !== "complete") {
        return;
    }

    if (first) {
        first = false;
        chrome.runtime.sendMessage({action: "get"}, function (response) {

            config.enable = response.enable;
            config.max = response.max;

            _ENABLE_LIST[0] = response.tiktok_like;
            _ENABLE_LIST[1] = response.tiktok_follow;

            _ENABLE_LIST[2] = response.ig_like;
            _ENABLE_LIST[3] = response.ig_follow;

            _ENABLE_LIST[4] = response.fb_page_like;
            _ENABLE_LIST[5] = response.fb_share;
            _ENABLE_LIST[6] = response.fb_follow;
            _ENABLE_LIST[7] = response.fb_post_like;
            _ENABLE_LIST[8] = response.fb_post_share;

            _ENABLE_LIST[9] = response.twitter_follow;
            _ENABLE_LIST[10] = response.twitter_tweet;
            _ENABLE_LIST[11] = response.twitter_retweet;
            _ENABLE_LIST[12] = response.twitter_like;

            _ENABLE_LIST[13] = response.yt_sub;
            _ENABLE_LIST[14] = response.yt_like;

            _ENABLE_LIST[15] = response.sc_follow;
            _ENABLE_LIST[16] = response.sc_like;

            _ENABLE_LIST[17] = response.reddit_follow;
            _ENABLE_LIST[18] = response.reddit_like;

            _ENABLE_LIST[19] = response.coinmarketcap_watch;

            _ENABLE_LIST[20] = response.telegram_follow;

            _ENABLE_LIST[21] = response.twitch_follow;

            _ENABLE_LIST[22] = response.website_view;

            _ENABLE_LIST[23] = response.likee_follow;

            _ENABLE_LIST[24] = response.ok_follow;

            _ENABLE_LIST[25] = response.reverbnation_follow;

            config.actionType = response.actType;
            tab_id = response.tabid;
        });
    }

    if (!config.enable) {
        return;
    }

    let cur_url = window.location.href;

    tick_count = tick_count + 1;

    if (state === _STATE_WAIT_TO_CLOSE) {
        if (wait_time > 0) {
            console.log("closing windows in " + wait_time + " seconds");
            wait_time--;
        } else {
            window.close();
        }
        return;
    }

    if (cur_url.indexOf("tiktok.com") !== -1) {
        do_tiktok();
        return;
    }

    if (cur_url.indexOf("instagram.com") !== -1) {
        do_instagram();
        return;
    }

    if (cur_url.indexOf("facebook.com") !== -1) {
        do_facebook();
        return;
    }

    if (cur_url.indexOf("twitter.com") !== -1) {
        do_twitter();
        return;
    }

    if (cur_url.indexOf("youtube.com") !== -1) {
        do_youtube();
        return;
    }

    if (cur_url.indexOf("soundcloud.com") !== -1) {
        do_soundcloud();
        return;
    }

    if (cur_url.indexOf("reddit.com") !== -1) {
        do_reddit();
        return;
    }

    if (cur_url.indexOf("coinmarketcap.com") !== -1) {
        do_coinmarketcap();
        return;
    }

    if (cur_url.indexOf("twitch.tv") !== -1) {
        do_twitch();
        return;
    }

    if (cur_url.indexOf("likee.video") !== -1) {
        do_likee();
        return;
    }

    if (cur_url.indexOf("reverbnation.com") !== -1) {
        do_reverbnation();
        return;
    }

    if (cur_url.indexOf("addmefast.com") === -1) {
        return;
    }

    removeErrorLike();

    if (isLoading()) {
        console.log("waiting ...");
        if (loading_tick_count >= _MAX_LOADING_WAIT_TIME) {
            console.log("wait timeout, next type");
            nextActionType();
            state = _STATE_WAIT;
            wait_time = generateRandom(20, 30);
            window.location.href = CurActionUrl;
        }

        return;
    }

    console.log("state : " + state);
    if (wait_time > 0) {
        wait_time--;
        return;
    }

    const cat = urlToActionType(cur_url);
    if (cat === -1) {
        console.log(cur_url)
        console.log("unknown url, get next type");
        nextActionType();
        state = _STATE_WAIT;
        wait_time = generateRandom(20, 30);
        window.location.href = CurActionUrl;
        return;
    }

    checkReloadButton();

    if (config.actionType !== cat) {
        chrome.runtime.sendMessage({action: "setActType", actType: cat});
    }

    config.actionType = cat;

    if (state === _STATE_WAIT) {
        window.location.href = cur_url;
        return;
    }

    let btn;
    if (state === _STATE_IDLE) {
        btn = document.querySelector("div.btn3");
        if (!btn) {
            console.log("No Button Found !");
            nextActionType();
            state = _STATE_WAIT;
            wait_time = generateRandom(20, 30);
            window.location.href = CurActionUrl;
            return;
        }

        // click the button
        if (btn.textContent !== "Confirm") {
            if (click_count >= config.max) {
                console.log("max-click " + click_count + ", next type");
                nextActionType();
                state = _STATE_WAIT;
                wait_time = generateRandom(20, 30);
                window.location.href = CurActionUrl;
                return;
            }

            click_count++;
            state = _STATE_TASK_STARTED;
            wait_time = generateRandom(12, 90);
            chrome.runtime.sendMessage({action: "setActType", actType: config.actionType});
        } else {
            wait_time = generateRandom(5, 10);
        }

        btn.click();
        return;
    }

    if (state === _STATE_TASK_STARTED) {
        state = _STATE_IDLE;
        return;
    }

}, 1000);
