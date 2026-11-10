(function (AMF) {
    'use strict';
    const d = AMF.dom;

    const FOLLOW = ['.follow', 'button[class*="follow" i]', '[class*="follow-btn" i]'];
    const isFollowing = (el) => /^(following|followed|unfollow)$/i.test(d.text(el)) || /followed|following/i.test(el.className);

    AMF.handlers.likee_follow = () => d.clickOnce({
        target: () => d.first(FOLLOW, (el) => !isFollowing(el)) || d.byText('button', /^\+?\s*follow$/i),
        already: () => d.first(FOLLOW, isFollowing),
    });
})(globalThis.AMF);
