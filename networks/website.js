let website_done = false;

function do_website() {

    // state = _STATE_IDLE;
    wait_time = 30;

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (website_done) {
        return;
    }
    website_done = true;

    console.log("website_done");
}