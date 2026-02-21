function do_twitch_sub() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);

    const followSelectors = [
        'button[aria-label="Follow"]',
        'button[aria-label="Follow"]',
        'button[data-a-target="follow-button"]',
        'button.follow-button',
        'button:contains("Follow")'
    ];

    let btn = null;
    for (const sel of followSelectors) {
        btn = document.querySelector(sel);
        if (btn) break;
    }

    if (!btn) {
        const btns = document.getElementsByTagName("button");
        for (let i = 0; i < btns.length; i++) {
            if (btns[i].textContent && btns[i].textContent.includes("Follow")) {
                btn = btns[i];
                break;
            }
        }
    }

    if (btn) {
        const isFollowing = btn.textContent === "Following" || btn.classList.contains('following');
        if (!isFollowing) {
            btn.click();
        } else {
            console.log("Already following");
        }
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