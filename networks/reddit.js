
function do_reddit_like() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);

    const upvoteSelectors = [
        'button[aria-label="upvote"]',
        'button[data-testid="upvote"]',
        'button[aria-label="upvote"] svg',
        '.voteButton[data-click-label="upvote"]',
        'button[name="upvote"]',
        'button[data-adclicklocation="upvote"]'
    ];

    let btn = null;
    for (const sel of upvoteSelectors) {
        btn = document.querySelector(sel);
        if (btn) break;
    }

    if (!btn) {
        console.log("like button not found !");
        return;
    }

    btn.click();

    if (counter['reddit_like']) {
        counter['reddit_like'] = counter['reddit_like'] + 1;
    } else {
        counter['reddit_like'] = {
            total: 0,
            good: 0,
            bad: 0,
        }
    }

    console.log(counter)
}

function do_reddit_follow() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(5, 8);

    const followSelectors = [
        'button._1LHxa-yaHJwrPK8kuyv_Y4',
        'button[data-testid="subscribe-button"]',
        'button[aria-label="Join"]',
        'button:contains("Join")',
        'button.join-button',
        'button[data-click-location="sidebar"]'
    ];

    let btn = null;
    for (const sel of followSelectors) {
        btn = document.querySelector(sel);
        if (btn) break;
    }
    
    if (!btn) {
        const joinBtns = document.querySelectorAll('button');
        for (let i = 0; i < joinBtns.length; i++) {
            if (joinBtns[i].textContent && joinBtns[i].textContent.trim() === 'Join') {
                btn = joinBtns[i];
                break;
            }
        }
    }

    if (!btn) {
        console.log("follow button not found !");
        return;
    }

    btn.click();
}

let reddit_done = false;

function do_reddit() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (reddit_done) {
        return;
    }
    reddit_done = true;

    console.log("reddit_done");
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_REDDIT_FOLLOW) {

        console.log("do_reddit_follow");
        do_reddit_follow();
        return;
    }

    if (config.actionType === _ACTION_TYPE_REDDIT_LIKE) {
        console.log("do_reddit_like");
        do_reddit_like();
        return;
    }
}