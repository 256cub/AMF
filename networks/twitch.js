(function (AMF) {
    'use strict';
    const d = AMF.dom;

    AMF.handlers.twitch_follow = () => d.clickOnce({
        target: () => d.first(['button[data-a-target="follow-button"]', 'button[data-test-selector="follow-button"]']),
        already: () => d.first(['button[data-a-target="unfollow-button"]', 'button[data-test-selector="unfollow-button"]']),
    });
})(globalThis.AMF);
