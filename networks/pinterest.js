(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // Experimental. The follow button was checked on public profiles; the save button only shows
    // for signed-in visitors, so its selectors are best effort.
    AMF.handlers.pinterest_follow = () => d.clickOnce({
        target: () => d.first(['button[aria-label="Follow"]', '[data-test-id="user-follow-button"] button', '[data-test-id="board-follow-button"] button'],
            (el) => /^follow$/i.test(d.text(el) || d.label(el))),
        already: () => d.first('button[aria-label="Following"], button[aria-label="Unfollow"]') || d.byText('button', /^following$/i),
    });

    const SAVE = ['[data-test-id="PinBetterSaveButton"] button', '[data-test-id="closeup-save-button"] button',
        '[data-test-id="SaveButton"]', 'button[aria-label="Save"]'];

    AMF.handlers.pinterest_save = () => d.clickOnce({
        target: () => d.first(SAVE, (el) => !/^saved/i.test(d.text(el))) || d.byText('button', /^save$/i),
        already: () => d.byText('button, [role="button"]', /^saved/i),
        settle: 2500,
    });
})(globalThis.AMF);
