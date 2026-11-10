(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // Both the "add" and the "remove" link are always in the page; only one of them is visible.
    AMF.handlers.reverbnation_follow = () => d.clickOnce({
        target: () => d.first(['a.button--add--profile[data-fan-action="add"]', '[data-fan-action="add"]'])
            || d.byText('a, button', /^become a fan$/i),
        already: () => d.first(['a.button--added--profile', '[data-fan-action="remove"]']),
    });
})(globalThis.AMF);
