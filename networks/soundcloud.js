(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // The page's main control is the first visible one; track lists further down repeat the class.
    const isOn = (el) => !!el && el.classList.contains('sc-button-selected');

    function toggle(selector) {
        return () => d.clickOnce({
            target: () => {
                const el = d.first(selector);
                return el && !isOn(el) ? el : null;
            },
            already: () => isOn(d.first(selector)),
        });
    }

    AMF.handlers.sc_like = toggle('button.sc-button-like');
    AMF.handlers.sc_follow = toggle('button.sc-button-follow');
})(globalThis.AMF);
