const config = {
    enable: 0,
    max: 0,

    ig_like: false,
    ig_follow: false,

    tiktok_like: false,
    tiktok_follow: false,

    fb_page_like: false,
    fb_share: false,
    fb_follow: false,
    fb_post_like: false,
    fb_post_share: false,

    twitter_follow: false,
    twitter_tweet: false,
    twitter_retweet: false,
    twitter_like: false,

    yt_sub: false,
    yt_like: false,

    sc_follow: false,
    sc_like: false,

    reddit_follow: false,
    reddit_like: false,

    coinmarketcap_watch: false,

    telegram_follow: false,

    twitch_follow: false,

    website_view: false,

    likee_follow: false,

    ok_follow: false,

    reverbnation_follow: false

};

$(document).ready(function () {
    $("btn#start").click(function () {

        const txt = $(this).text();

        if (txt === "Start") {

            config.max = $('#max-click').val();

            config.ig_like = $("#instagram-like").is(":checked");
            config.ig_follow = $("#instagram-follow").is(":checked");

            config.tiktok_like = $("#tiktok-like").is(":checked");
            config.tiktok_follow = $("#tiktok-follow").is(":checked");

            config.fb_page_like = $("#facebook-page-like").is(":checked");
            config.fb_share = $("#facebook-share").is(":checked");
            config.fb_follow = $("#facebook-follow").is(":checked");
            config.fb_post_like = $("#facebook-post-like").is(":checked");
            config.fb_post_share = $("#facebook-post-share").is(":checked");

            config.twitter_follow = $("#twitter-follow").is(":checked");
            config.twitter_tweet = $("#twitter-tweet").is(":checked");
            config.twitter_retweet = $("#twitter-retweet").is(":checked");
            config.twitter_like = $("#twitter-like").is(":checked");

            config.yt_sub = $("#youtube-subscribe").is(":checked");
            config.yt_like = $("#youtube-like").is(":checked");

            config.sc_follow = $("#sc-follow").is(":checked");
            config.sc_like = $("#sc-like").is(":checked");

            config.reddit_follow = $("#reddit-follow").is(":checked");
            config.reddit_like = $("#reddit-like").is(":checked");

            config.coinmarketcap_watch = $("#coinmarketcap-watch").is(":checked");

            // config.telegram_follow = $("#telegram-follow").is(":checked");

            config.twitch_follow = $("#twitch-follow").is(":checked");

            // config.website_view = $("#website-view").is(":checked");

            config.likee_follow = $("#likee-follow").is(":checked");

            // config.ok_follow = $("#ok-follow").is(":checked");

            config.reverbnation_follow = $("#reverbnation-follow").is(":checked");

            if (
                (!config.ig_like) && (!config.ig_follow)
                && (!config.tiktok_like) && (!config.tiktok_follow)
                && (!config.fb_page_like) && (!config.fb_share) && (!config.fb_follow) && (!config.fb_post_like)  && (!config.fb_post_share)
                && (!config.twitter_follow) && (!config.twitter_tweet) && (!config.twitter_retweet) && (!config.twitter_like)
                && (!config.yt_sub) && (!config.yt_like)
                && (!config.sc_follow) && (!config.sc_like)
                && (!config.reddit_follow) && (!config.reddit_like)
                && (!config.coinmarketcap_watch)
                // && (!config.telegram_follow)
                && (!config.twitch_follow)
                // && (!config.website_view)
                && (!config.likee_follow)
                && (!config.ok_follow)
                && (!config.reverbnation_follow)
            ) {
                return;
            }

            config.enable = 1;
            $(this).text("Stop");
            $(this).removeClass("btn-success");
            $(this).addClass("btn-danger");

            chrome.storage.sync.set({
                max: config.max,
                ig_like: config.ig_like, ig_follow: config.ig_follow,
                tiktok_like: config.tiktok_like, tiktok_follow: config.tiktok_follow,
                fb_page_like: config.fb_page_like, fb_share: config.fb_share, fb_follow: config.fb_follow, fb_post_like: config.fb_post_like, fb_post_share: config.fb_post_share,
                twitter_follow: config.twitter_follow, twitter_tweet: config.twitter_tweet, twitter_retweet: config.twitter_retweet, twitter_like: config.twitter_like,
                yt_sub: config.yt_sub, yt_like: config.yt_like,
                sc_follow: config.sc_follow, sc_like: config.sc_like,
                reddit_follow: config.reddit_follow, reddit_like: config.reddit_like,
                coinmarketcap_watch: config.coinmarketcap_watch,
                telegram_follow: config.telegram_follow,
                twitch_follow: config.twitch_follow,
                website_view: config.website_view,
                likee_follow: config.likee_follow,
                ok_follow: config.ok_follow,
                reverbnation_follow: config.reverbnation_follow
            });

        } else {
            $(this).text("Start");
            $(this).removeClass("btn-danger");
            $(this).addClass("btn-success");
            config.enable = 0;
        }

        set_status();
    });

    get_status();
    //setInterval(get_status,1000);
});

function set_status() {

    EnableControls(config.enable ? true : false);
    chrome.runtime.sendMessage({
        action: "set",
        enable: config.enable,
        max: config.max,

        ig_like: config.ig_like,
        ig_follow: config.ig_follow,

        tiktok_like: config.tiktok_like,
        tiktok_follow: config.tiktok_follow,

        fb_page_like: config.fb_page_like,
        fb_share: config.fb_share,
        fb_follow: config.fb_follow,
        fb_post_like: config.fb_post_like,
        fb_post_share: config.fb_post_share,

        twitter_follow: config.twitter_follow,
        twitter_tweet: config.twitter_tweet,
        twitter_retweet: config.twitter_retweet,
        twitter_like: config.twitter_like,

        yt_sub: config.yt_sub,
        yt_like: config.yt_like,

        sc_follow: config.sc_follow,
        sc_like: config.sc_like,

        reddit_follow: config.reddit_follow,
        reddit_like: config.reddit_like,

        coinmarketcap_watch: config.coinmarketcap_watch,

        telegram_follow: config.telegram_follow,

        twitch_follow: config.twitch_follow,

        website_view: config.website_view,

        likee_follow: config.likee_follow,

        ok_follow: config.ok_follow,

        reverbnation_follow: config.reverbnation_follow

    }, function (response) {
    });

}

function get_status() {
    const $b = $("btn#start");

    chrome.runtime.sendMessage({action: "get"}, function (response) {

        config.enable = response.enable;
        config.max = response.max;

        config.ig_like = response.ig_like;
        config.ig_follow = response.ig_follow;

        config.tiktok_like = response.tiktok_like;
        config.tiktok_follow = response.tiktok_follow;

        config.fb_page_like = response.fb_page_like;
        config.fb_share = response.fb_share;
        config.fb_follow = response.fb_follow;
        config.fb_post_like = response.fb_post_like;
        config.fb_post_share = response.fb_post_share;

        config.twitter_follow = response.twitter_follow;
        config.twitter_tweet = response.twitter_tweet;
        config.twitter_retweet = response.twitter_retweet;
        config.twitter_like = response.twitter_like;

        config.yt_sub = response.yt_sub;
        config.yt_like = response.yt_like;

        config.sc_follow = response.sc_follow;
        config.sc_like = response.sc_like;

        config.reddit_follow = response.reddit_follow;
        config.reddit_like = response.reddit_like;

        config.coinmarketcap_watch = response.coinmarketcap_watch;

        config.telegram_follow = response.telegram_follow;

        config.twitch_follow = response.twitch_follow;

        config.website_view = response.website_view;

        config.likee_follow = response.likee_follow;

        config.ok_follow = response.ok_follow;

        config.reverbnation_follow = response.reverbnation_follow;

        if (config.enable === 0) {
            $b.text("Start");
            $b.removeClass("btn-danger");
            $b.addClass("btn-success");
        } else {
            $b.text("Stop");
            $b.removeClass("btn-success");
            $b.addClass("btn-danger");
        }

        $('#max-click').val(config.max);

        $('#instagram-like').prop("checked", config.ig_like);
        $('#instagram-follow').prop("checked", config.ig_follow);

        $('#tiktok-like').prop("checked", config.tiktok_like);
        $('#tiktok-follow').prop("checked", config.tiktok_follow);

        $('#facebook-page-like').prop("checked", config.fb_page_like);
        $('#facebook-share').prop("checked", config.fb_share);
        $('#facebook-follow').prop("checked", config.fb_follow);
        $('#facebook-post-like').prop("checked", config.fb_post_like);
        $('#facebook-post-share').prop("checked", config.fb_post_share);

        $('#twitter-follow').prop("checked", config.twitter_follow);
        $('#twitter-tweet').prop("checked", config.twitter_tweet);
        $('#twitter-retweet').prop("checked", config.twitter_retweet);
        $('#twitter-like').prop("checked", config.twitter_like);

        $('#youtube-subscribe').prop("checked", config.yt_sub);
        $('#youtube-like').prop("checked", config.yt_like);

        $('#sc-follow').prop("checked", config.sc_follow);
        $('#sc-like').prop("checked", config.sc_like);

        $('#reddit-follow').prop("checked", config.reddit_follow);
        $('#reddit-like').prop("checked", config.reddit_like);

        $('#coinmarketcap-watch').prop("checked", config.coinmarketcap_watch);

        // $('#telegram-follow').prop("checked", config.telegram_follow);

        $('#twitch-follow').prop("checked", config.twitch_follow);

        // $('#website-view').prop("checked", config.website_view);

        $('#likee-follow').prop("checked", config.likee_follow);

        $('#ok_follow').prop("checked", config.ok_follow);

        $('#reverbnation-follow').prop("checked", config.reverbnation_follow);

        EnableControls(!!config.enable);
    });
}


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {

        if (request.action === "count") {
            $("btn#count").text(request.value);
            if (request.enable !== 1) {
                const $b = $("btn#start");
                $b.removeClass("btn-danger");
                $b.addClass("btn-success");
                $b.text("Start");
            }
            return;
        }
    });

function EnableControls(val) {
    $('#max-click').prop("disabled", val);

    $('#instagram-like').prop("disabled", val);
    $('#instagram-follow').prop("disabled", val);

    $('#tiktok-like').prop("disabled", val);
    $('#tiktok-follow').prop("disabled", val);

    $('#facebook-page-like').prop("disabled", val);
    $('#facebook-share').prop("disabled", val);
    $('#facebook-follow').prop("disabled", val);
    $('#facebook-post-like').prop("disabled", val);
    $('#facebook-post-share').prop("disabled", val);

    $('#twitter-follow').prop("disabled", val);
    $('#twitter-tweet').prop("disabled", val);
    $('#twitter-retweet').prop("disabled", val);
    $('#twitter-like').prop("disabled", val);

    $('#youtube-subscribe').prop("disabled", val);
    $('#youtube-like').prop("disabled", val);

    $('#sc-follow').prop("disabled", val);
    $('#sc-like').prop("disabled", val);

    $('#reddit-follow').prop("disabled", val);
    $('#reddit-like').prop("disabled", val);

    $('#coinmarketcap-watch').prop("disabled", val);

    // $('#telegram-follow').prop("disabled", val);

    $('#twitch-follow').prop("disabled", val);

    // $('#website-view').prop("disabled", val);

    $('#likee-follow').prop("disabled", val);

    // $('#ok-follow').prop("disabled", val);

    $('#reverbnation-follow').prop("disabled", val);

}