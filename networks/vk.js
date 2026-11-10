(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // Experimental: groups and public pages share one subscribe button on the current VK layout.
    const BUTTON = ['button[data-testid="group-subscribe-button"]', '#join_button', '#public_subscribe', 'button[data-testid*="subscribe"]'];
    const JOINED = /^(following|subscribed|you('re| are) (a )?member|member|вы подписаны|вы участник|вы в группе)/i;

    const handler = () => d.clickOnce({
        target: () => d.first(BUTTON, (el) => !JOINED.test(d.text(el))),
        already: () => d.first(BUTTON, (el) => JOINED.test(d.text(el)))
            || d.first('[data-testid="group-unsubscribe-button"], [data-testid*="subscribed"]'),
    });

    AMF.handlers.vk_group = handler;
    AMF.handlers.vk_page = handler;
})(globalThis.AMF);
