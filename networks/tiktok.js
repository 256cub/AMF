function do_tiktok_like() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(8, 12);

    const likeSelectors = [
        'div.engagement-icon-v23',
        'span[data-e2e="like-icon"]',
        'div[data-e2e="like-icon"]',
        'button[aria-label="like"]',
        '[data-e2e="like"]'
    ];

    let likeBtn = null;
    for (const sel of likeSelectors) {
        likeBtn = document.querySelector(sel);
        if (likeBtn) break;
    }

    if (!likeBtn) {
        console.log("like button not found !");
        return false;
    }

    const isLiked = likeBtn.classList.contains('liked') || 
                    likeBtn.getAttribute('data-e2e-status') === 'liked' ||
                    likeBtn.querySelector('svg[fill]');

    if (isLiked) {
        console.log("Already liked, skipping");
        return false;
    }

    console.log("Clicked like!");
    click(likeBtn);
    return true;
}

function do_tiktok_follow() {

    state = _STATE_WAIT_TO_CLOSE;
    wait_time = generateRandom(8, 12);

    const followSelectors = [
        'button:contains("Follow")',
        '[data-e2e="follow"]',
        'button[data-e2e="follow-button"]',
        'div[data-e2e="follow"]'
    ];

    let btn = null;
    for (const sel of followSelectors) {
        btn = document.querySelector(sel);
        if (btn) break;
    }

    if (!btn) {
        const btns = document.getElementsByTagName("button");
        if (!btns || btns.length < 1) {
            return false;
        }

        for (let i = 0; i < btns.length; i++) {
            if (btns[i].textContent === "Follow") {
                btn = btns[i];
                break;
            }
        }
    }

    if (!btn) {
        console.log("follow button not found !");
        return false;
    }

    const isFollowing = btn.textContent === "Following" || btn.classList.contains('following');
    if (isFollowing) {
        console.log("Already following, skipping");
        return false;
    }

    click(btn);
    return true;
}

let tiktok_done = false;

function do_tiktok() {

    // wait for 5 seconds
    if (tick_count < 2) {
        return;
    }

    if (tick_count > _TIMEOUT_IN_SECS) {
        // timeout
        window.close();
    }

    if (tiktok_done) {
        return;
    }

    tiktok_done = true;
    console.log("config.actionType = " + config.actionType);

    if (config.actionType === _ACTION_TYPE_TIKTOK_LIKE) {

        do_tiktok_like();
        return;
    }

    if (config.actionType === _ACTION_TYPE_TIKTOK_FOLLOW) {
        do_tiktok_follow();
        return;
    }
}