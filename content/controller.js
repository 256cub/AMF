/*
 * Runs on addmefast.com. Does nothing unless the service worker says this tab is the controller
 * of a running session; then it walks the task pages and presses the task button.
 */
(function (AMF) {
    'use strict';

    if (window.top !== window) return;

    const IDLE = 'idle';
    const TASK = 'task';

    const POPUP_OPEN_TIMEOUT = 20;   // seconds to wait for the task window to appear
    const TASK_MAX_SECONDS = 150;    // the service worker closes a stuck task tab long before this
    const LOADING_MAX_SECONDS = 30;
    const NO_BUTTON_GRACE = 8;       // seconds a task page may take to show its button
    const BACKOFF_STEP = 60;
    const BACKOFF_MAX = 300;

    let running = false;
    let settings = null;
    let discovered = {};
    let emptyStreak = 0;

    let state = IDLE;
    let wait = AMF.rand(4, 7);
    let clicks = 0;
    let loadingTicks = 0;
    let noButtonTicks = 0;
    let openFailures = 0;
    let taskOpen = false;
    let leaving = false;
    let lastStatus = '';

    const send = (message) => chrome.runtime.sendMessage(message).catch(() => null);

    function report(text, level, log) {
        if (text === lastStatus) return;
        lastStatus = text;
        send({type: 'status', text, level: level || 'info', log: !!log});
    }

    function name(action) {
        const network = AMF.NETWORKS.find((n) => n.id === action.network);
        return (network ? network.name : action.network) + ' · ' + action.label;
    }

    // ---------------------------------------------------------------- page checks

    /** Cloudflare (or a similar) interstitial. A person has to pass it; the bot only waits. */
    function isSecurityCheck() {
        return /just a moment|attention required|verify you are human/i.test(document.title)
            || !!document.querySelector('#challenge-form, #challenge-running, #challenge-error-text, #cf-wrapper, #cf-error-details');
    }

    function isLoggedOut() {
        return !!document.querySelector('input[type="password"]');
    }

    function isLoading() {
        return !!document.querySelector('div#loading-indicator-site-links-list-overlay');
    }

    function dismissError() {
        const box = document.querySelector('div.error_like');
        if (!box) return false;
        box.remove();
        return true;
    }

    function clickReloadDialog() {
        if (!document.querySelector('div.ui-dialog[aria-labelledby="ui-dialog-title-timeout"]')) return false;
        const btn = document.querySelector('input[name="reload"]');
        if (!btn) return false;
        btn.click();
        return true;
    }

    function taskButton() {
        return document.querySelector('div.btn3') || document.querySelector('.btn3');
    }

    function discover() {
        const hrefs = Array.from(document.querySelectorAll('a[href*="free_points"]'), (a) => a.href);
        const paths = AMF.discoverPaths(hrefs);
        const fresh = Object.keys(paths).filter((id) => discovered[id] !== paths[id]);
        if (!fresh.length) return;
        Object.assign(discovered, paths);
        send({type: 'discovered', paths});
    }

    /** Consecutive landings outside a task page, kept per tab across reloads. `0` resets it. */
    function bounce(step) {
        const key = 'amfBotBounce';
        try {
            const value = step ? (parseInt(sessionStorage.getItem(key), 10) || 0) + step : 0;
            sessionStorage.setItem(key, String(value));
            return value;
        } catch (e) {
            return 1;
        }
    }

    // ---------------------------------------------------------------- navigation

    function finish(text, level) {
        running = false;
        send({type: 'finished', text, level});
    }

    function goTo(action, delaySeconds) {
        leaving = true;
        const url = AMF.urlFor(action, discovered);
        setTimeout(() => {
            if (running) window.location.href = url;
        }, Math.max(0, delaySeconds || 0) * 1000);
    }

    /** Leave the current task page for the next enabled one. `empty` means this page had no task. */
    async function goNext(current, empty) {
        const next = AMF.nextAction(current ? current.id : null, settings, discovered);
        if (!next) {
            const wanted = AMF.ACTIONS.some((a) => settings.enabled[a.id] && AMF.isRunnable(a));
            finish(wanted
                ? 'Stopped: the selected actions were not found in the AddMeFast menu'
                : 'Stopped: no actions are selected', 'warn');
            return;
        }

        let delay = 0;
        if (empty) {
            const reply = await send({type: 'empty'});
            emptyStreak = reply && reply.emptyStreak ? reply.emptyStreak : emptyStreak + 1;
            // A whole round without a single task: slow down instead of reloading pages in a loop.
            const rounds = Math.floor(emptyStreak / AMF.runnableIds(settings, discovered).length);
            if (rounds >= 1) {
                delay = Math.min(rounds * BACKOFF_STEP, BACKOFF_MAX);
                report('No tasks available right now, trying again in ' + delay + ' s', 'warn');
            }
        }
        if (!running) return;
        if (!delay) report('Opening ' + name(next));
        goTo(next, delay);
    }

    // ---------------------------------------------------------------- main loop

    async function tick() {
        if (!running || leaving) return;

        if (isSecurityCheck()) {
            report('Paused: AddMeFast is showing a security check. Complete it in the tab and the bot continues.', 'warn', true);
            return;
        }

        const action = AMF.actionByUrl(window.location.href, discovered);

        if (!action && isLoggedOut()) {
            report('Paused: log in to AddMeFast in this tab and the bot continues.', 'warn', true);
            return;
        }

        if (dismissError()) wait = Math.max(wait, AMF.rand(10, 20));

        if (isLoading()) {
            if (++loadingTicks >= LOADING_MAX_SECONDS) await goNext(action, true);
            return;
        }
        loadingTicks = 0;

        if (wait > 0) {
            wait--;
            return;
        }

        if (!action) {
            // Sent to a task page but landed somewhere else, usually because the session expired.
            // Every fourth miss in a row pauses for a minute so the tab is not reloaded in a tight loop.
            if (bounce(+1) % 4 === 0) {
                report('Paused: AddMeFast keeps leaving the task pages. Check that you are logged in; retrying in 60 s.', 'warn', true);
                wait = 60;
                return;
            }
            await goNext(null, false);
            return;
        }
        bounce(0);

        if (!settings.enabled[action.id]) {
            await goNext(action, false);
            return;
        }

        if (clickReloadDialog()) {
            wait = AMF.rand(20, 30);
            return;
        }

        if (state === TASK) {
            // The wait ran out. Either the task window never opened or it never closed.
            state = IDLE;
            if (!taskOpen && ++openFailures >= 3) {
                report('No task window opened. Allow pop-ups for addmefast.com (address bar icon), then it continues.', 'warn', true);
                wait = 30;
            }
            return;
        }

        const btn = taskButton();
        if (!btn) {
            if (++noButtonTicks >= NO_BUTTON_GRACE) await goNext(action, true);
            return;
        }
        noButtonTicks = 0;

        if (btn.textContent.trim() === 'Confirm') {
            wait = AMF.rand(5, 10);
            btn.click();
            return;
        }

        if (clicks >= settings.max) {
            await goNext(action, false);
            return;
        }

        clicks++;
        state = TASK;
        taskOpen = false;
        wait = POPUP_OPEN_TIMEOUT;
        await send({type: 'taskStart', actionId: action.id});
        if (running) btn.click();
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (!message) return;
        switch (message.type) {
            case 'stop':
                running = false;
                break;
            case 'settings':
                settings = message.settings;
                break;
            case 'taskOpened':
                taskOpen = true;
                openFailures = 0;
                if (state === TASK) wait = TASK_MAX_SECONDS;
                break;
            case 'taskClosed':
                taskOpen = false;
                state = IDLE;
                wait = AMF.rand(3, 6);
                break;
        }
    });

    (async function init() {
        const hello = await send({type: 'hello'});
        if (!hello || !hello.running) return;

        running = true;
        settings = hello.settings;
        discovered = hello.discovered || {};
        emptyStreak = hello.emptyStreak || 0;
        taskOpen = !!hello.taskOpen;
        if (taskOpen) {
            // The page reloaded while a task window is still open: wait for it instead of opening another.
            state = TASK;
            wait = TASK_MAX_SECONDS;
        }

        discover();
        let busy = false;
        setInterval(async () => {
            if (busy) return;
            busy = true;
            try {
                await tick();
            } finally {
                busy = false;
            }
        }, 1000);
    })();
})(globalThis.AMF);
