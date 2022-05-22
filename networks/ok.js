function do_ok_like() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    let btn = document.querySelector('button[aria-label^="like"]');
    if (btn) {
        btn.click();
    } else {
        console.log("like button not found !");
    }
}

function do_ok_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    const buttons = document.querySelectorAll('.ytd-subscribe-button-renderer');
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

let ok_done = false;

function do_ok() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (ok_done) {
        return;
    }
    ok_done = true;

    console.log("ok_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_YT_SUB) {

        console.log("do_ok_sub");
        do_ok_sub();
        return;
    }

    if (config.actionType === _ACTION_TYPE_YT_LIKE) {
        console.log("do_ok_like");
        do_ok_like();
        return;
    }
}