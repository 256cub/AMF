/*
 * Runs on the social network pages. It stays completely passive unless the service worker
 * confirms that this exact tab was opened by the bot for a task.
 */
(async function (AMF) {
    'use strict';

    if (window.top !== window) return;

    const send = (message) => chrome.runtime.sendMessage(message).catch(() => null);

    const hello = await send({type: 'taskHello'});
    if (!hello || !hello.actionId) return;

    const handler = AMF.handlers[hello.actionId];
    let outcome;
    try {
        outcome = handler ? await handler() : {status: 'error', detail: 'no handler for ' + hello.actionId};
    } catch (e) {
        outcome = {status: 'error', detail: String((e && e.message) || e)};
    }

    await send(Object.assign({type: 'taskResult'}, outcome));

    // Leave the page open for a moment so the site can register the action before the tab closes.
    await AMF.dom.sleep(AMF.rand(5000, 8000));
    await send({type: 'taskClose'});
    window.close();
})(globalThis.AMF);
