function do_reddit_like() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    let btn = document.querySelector('button[aria-label="upvote"]');

    if (!btn) {
        console.log("like button not found !");
        return;
    }

    btn.click();
}

function do_reddit_follow() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    console.log("DEBUG 1");

    let btn = document.querySelector('button._1LHxa-yaHJwrPK8kuyv_Y4');
    if (!btn) {
        console.log("follow button not found !");
        return;
    }

    console.log("DEBUG 2");

    btn.click();
}

let reddit_done = false;

function do_reddit() {

    console.log("DEBUG 3");

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (reddit_done) {
        return;
    }
    reddit_done = true;

    console.log("reddit_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_REDDIT_FOLLOW) {

        console.log("do_reddit_follow");
        do_reddit_follow();
        return;
    }

    if (config.actionType === _ACTION_TYPE_REDDIT_LIKE) {
        console.log("do_reddit_like");
        do_reddit_like();
        return;
    }
}