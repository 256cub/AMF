function do_yt_like() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);

    let btn = document.querySelector('button[aria-label^="like"]');
    if (btn) {
        btn.click();
    } else {
        console.log("like button not found !");
    }
}

function do_yt_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);


    const subscribeSpans = document.querySelectorAll('span.yt-core-attributed-string');

    for (let span of subscribeSpans) {
        if (span.textContent === 'Subscribe') {
            const button = span.closest('button');
            if (button) {
                button.click();
                return true;
            }
        }
    }
    console.log("No Subscribe button found :(");
    return false;
}

let youtube_done = false;

function do_youtube() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (youtube_done) {
        return;
    }
    youtube_done = true;

    console.log("youtube_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_YT_SUB) {
        console.log("do_yt_sub");
        do_yt_sub();
        return;
    }

    if (config.actionType === _ACTION_TYPE_YT_LIKE) {
        console.log("do_yt_like");
        do_yt_like();
        return;
    }
}