(function (AMF) {
    'use strict';
    const d = AMF.dom;

    const SUB_SCOPE = 'ytd-subscribe-button-renderer button, yt-subscribe-button-view-model button, #subscribe-button button';

    // The filled button is the call to action; once subscribed YouTube swaps it for a tonal one.
    const isSubscribeCta = (el) => /^subscribe(?!d)/i.test(d.label(el) || d.text(el)) || /Filled|--filled/.test(el.className);
    const isSubscribed = (el) => /^(subscribed|unsubscribe)/i.test(d.text(el) || d.label(el));

    AMF.handlers.yt_sub = () => d.clickOnce({
        target: () => d.first([SUB_SCOPE, 'button[aria-label^="Subscribe" i]'], (el) => isSubscribeCta(el) && !isSubscribed(el)),
        already: () => !d.first([SUB_SCOPE, 'button[aria-label^="Subscribe" i]'], (el) => isSubscribeCta(el) && !isSubscribed(el))
            && d.first([SUB_SCOPE, 'button[aria-label^="Unsubscribe" i]'], isSubscribed),
    });

    const LIKE = [
        'like-button-view-model button[aria-pressed]',
        '#segmented-like-button button[aria-pressed]',
        'ytd-menu-renderer ytd-toggle-button-renderer button[aria-pressed]',
        '#like-button button[aria-pressed]',
    ];

    AMF.handlers.yt_like = () => d.clickOnce({
        target: () => d.first(LIKE, (el) => !d.pressed(el)),
        already: () => d.pressed(d.first(LIKE)),
    });
})(globalThis.AMF);
