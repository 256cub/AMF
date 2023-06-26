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
    //The "Subscribe" button wasn't being clicked, so I changed the CSS selector from '.ytd-subscribe-button-renderer' to '.yt-spec-button-shape-next--filled > div:nth-child(1)', and now it's working perfectly
    const buttons = document.querySelectorAll('.yt-spec-button-shape-next--filled > div:nth-child(1)');
    if ((!buttons) || (buttons.length < 1)) {
        console.log("No Subscribe button found :()");
        return;
    }

    for (let i = 0; i < buttons.length; i++) {
        const s = buttons[i].textContent;
        if (s === 'Subscribe') {
            buttons[i].click();
            break;
        }
    }
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
