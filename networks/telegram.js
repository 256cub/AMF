function do_telegram_like() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);

    let btn = document.querySelector('button[aria-label^="like"]');
    if (btn) {
        btn.click();
    } else {
        console.log("like button not found !");
    }
}

function do_telegram_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);

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

let telegram_done = false;

function do_telegram() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (telegram_done) {
        return;
    }
    telegram_done = true;

    console.log("telegram_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_YT_SUB) {

        console.log("do_telegram_sub");
        do_telegram_sub();
        return;
    }

    if (config.actionType === _ACTION_TYPE_YT_LIKE) {
        console.log("do_telegram_like");
        do_telegram_like();
        return;
    }
}