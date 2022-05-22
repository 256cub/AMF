function do_twitch_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    let btn = document.querySelector('button[aria-label="Follow"]');
    if (btn) {
        btn.click();
    } else {
        console.log("Follow button not found !");
    }
}

let twitch_done = false;

function do_twitch() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (twitch_done) {
        return;
    }
    twitch_done = true;

    console.log("twitch_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_TWITCH_FOLLOW) {

        console.log("do_twitch_sub");
        do_twitch_sub();
        return;
    }
}