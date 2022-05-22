function do_likee_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    const buttons = document.querySelectorAll('.follow');
    if ((!buttons) || (buttons.length < 1)) {
        console.log("No Follow button found :()");
        return;
    }

    buttons[0].click();

    // for (let i = 0; i < buttons.length; i++) {
    //     const s = buttons[i].textContent;
    //     if (s === 'Follow') {
    //         buttons[i].click();
    //         break;
    //     }
    // }
}

let likee_done = false;

function do_likee() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (likee_done) {
        return;
    }
    likee_done = true;

    console.log("likee_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_LIKEE_FOLLOW) {

        console.log("do_likee_sub");
        do_likee_sub();
        return;
    }
}