(function (AMF) {
    'use strict';
    const d = AMF.dom;

    const STAR = ['button[data-test="watchlist-star"]', '[data-test="watchlist-button"] button', 'button .icon-Star'];

    // The star is a toggle with no pressed attribute, so "already added" is read from its icon.
    function isWatched(el) {
        if (d.pressed(el)) return true;
        const use = el.querySelector('use');
        const icon = use ? (use.getAttribute('href') || use.getAttribute('xlink:href') || '') : '';
        return /filled|solid|active/i.test(icon) || /(^|[\s_-])(active|selected|watched)([\s_-]|$)/i.test(el.className);
    }

    AMF.handlers.coinmarketcap_watch = () => d.clickOnce({
        target: () => {
            const el = d.first(STAR);
            return el && !isWatched(el) ? el : null;
        },
        already: () => {
            const el = d.first(STAR);
            return el && isWatched(el);
        },
    });
})(globalThis.AMF);
