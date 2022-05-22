function do_reverbnation_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    const buttons = document.querySelectorAll('.button--add--profile');
    if ((!buttons) || (buttons.length < 1)) {
        console.log("No Become a Fan button found :()");
        return;
    }

    for (let i = 0; i < buttons.length; i++) {
        const s = buttons[i].textContent;
        if (s === ' Become a Fan') {
            buttons[i].click();
            break;
        }
    }
}

let reverbnation_done = false;

function do_reverbnation() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (reverbnation_done) {
        return;
    }
    reverbnation_done = true;

    console.log("reverbnation_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_REVERBNATION_FOLLOW) {

        console.log("do_reverbnation_sub");
        do_reverbnation_sub();
        return;
    }
}