function do_coinmarketcap_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = 6;

    const buttons = document.querySelectorAll('.icon-Star');
    if ((!buttons) || (buttons.length < 1)) {
        console.log("No Favorite button found :()");
        return;
    }

    buttons[0].click();
}

let coinmarketcap_watch = false;

function do_coinmarketcap() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (coinmarketcap_watch) {
        return;
    }
    coinmarketcap_watch = true;

    console.log("coinmarketcap_watch");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_COINMARKETCAT_WATCH) {

        console.log("do_coinmarketcap_sub");
        do_coinmarketcap_sub();
        return;
    }

}