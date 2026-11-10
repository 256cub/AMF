(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // Experimental: selectors come from the public group page, not from a signed-in session.
    const JOIN = /^(join|join group|subscribe|вступить|подписаться|присоединиться)$/i;
    const MEMBER = /^(member|you are a member|subscribed|leave group|в группе|вы в группе|участник|вы подписаны)$/i;
    const SCOPE = 'button[data-uikit="Button"], ui-groups-main-menu-button button, button, a.button-pro';

    AMF.handlers.ok_follow = () => d.clickOnce({
        target: () => d.byText(SCOPE, JOIN),
        already: () => !d.byText(SCOPE, JOIN) && d.byText(SCOPE, MEMBER),
    });
})(globalThis.AMF);
