(function (AMF) {
    'use strict';
    const d = AMF.dom;

    const BUTTONS = 'header button, header [role="button"], main button, main [role="button"]';

    AMF.handlers.ig_follow = () => d.clickOnce({
        target: () => d.first(BUTTONS, (el) => /^follow( back)?$/i.test(d.text(el))),
        already: () => d.first(BUTTONS, (el) => /^(following|requested)$/i.test(d.text(el))),
    });

    // The post's own heart is the 24px icon; the small ones belong to comments.
    function heart(name) {
        const icon = d.first('svg[aria-label="' + name + '"]', (el) => Number(el.getAttribute('height')) >= 20)
            || d.first('svg[aria-label="' + name + '"]');
        return icon ? (icon.closest('[role="button"], button') || icon.parentElement) : null;
    }

    AMF.handlers.ig_like = () => d.clickOnce({
        target: () => heart('Like'),
        already: () => !heart('Like') && heart('Unlike'),
    });
})(globalThis.AMF);
