/*
 * Service worker. Owns all state (so it survives the worker being suspended) and decides
 * which tabs the bot may touch:
 *   - the controller tab: the one AddMeFast tab the run was started in
 *   - the task tab: a tab opened by the controller tab while a task is in progress
 * Every other tab in the browser is left alone.
 */
importScripts('shared/actions.js');

const A = self.AMF;

const TASK_ALARM = 'amf-task-timeout';
const TASK_TIMEOUT_MINUTES = 1.5;
const LOG_LIMIT = 80;
const AMF_TAB_PATTERNS = ['*://addmefast.com/*', '*://*.addmefast.com/*'];
const DISCOVERY_PATH = '/free_points/youtube_likes';

function freshRuntime() {
    return {
        running: false,
        controllerTabId: null,
        taskTabId: null,
        currentAction: null,
        taskResult: null,
        startedAt: 0,
        emptyStreak: 0,
        session: {tasks: 0, done: 0, already: 0, failed: 0},
        status: {text: 'Idle', level: 'info', at: 0},
    };
}

// ---------------------------------------------------------------- storage

async function getSettings() {
    const {settings} = await chrome.storage.local.get('settings');
    return A.mergeSettings(settings);
}

async function getDiscovered() {
    const {discovered} = await chrome.storage.local.get('discovered');
    return discovered || {};
}

async function getStats() {
    const {stats} = await chrome.storage.local.get('stats');
    return stats || {};
}

async function getRuntime() {
    const {runtime} = await chrome.storage.session.get('runtime');
    const base = freshRuntime();
    return Object.assign(base, runtime, {session: Object.assign(base.session, runtime && runtime.session)});
}

async function getLog() {
    const {log} = await chrome.storage.session.get('log');
    return log || [];
}

// All writes go through one queue so concurrent events cannot overwrite each other.
let queue = Promise.resolve();

function locked(fn) {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
}

/** Read-modify-write the runtime. Resolves with whatever `fn` returns. */
function updateRuntime(fn) {
    return locked(async () => {
        const rt = await getRuntime();
        const result = await fn(rt);
        await chrome.storage.session.set({runtime: rt});
        updateBadge(rt);
        return result;
    });
}

function addLog(text, level = 'info') {
    return locked(async () => {
        const log = await getLog();
        log.push({at: Date.now(), level, text});
        await chrome.storage.session.set({log: log.slice(-LOG_LIMIT)});
    });
}

function setStatus(rt, text, level = 'info') {
    rt.status = {text, level, at: Date.now()};
}

function updateBadge(rt) {
    chrome.action.setBadgeBackgroundColor({color: rt.running ? '#1f8f4e' : '#777777'});
    chrome.action.setBadgeText({text: rt.running ? String(rt.session.done) : ''});
}

function describe(actionId) {
    const action = A.getAction(actionId);
    if (!action) return actionId || 'task';
    const network = A.NETWORKS.find((n) => n.id === action.network);
    return (network ? network.name : action.network) + ' · ' + action.label;
}

function tell(tabId, message) {
    if (tabId == null) return;
    chrome.tabs.sendMessage(tabId, message).catch(() => {});
}

// ---------------------------------------------------------------- start / stop

async function findControllerTab() {
    const tabs = await chrome.tabs.query({url: AMF_TAB_PATTERNS});
    if (!tabs.length) return null;
    const [focused] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    return tabs.find((t) => focused && t.id === focused.id) || tabs[0];
}

async function start() {
    const settings = await getSettings();
    const discovered = await getDiscovered();
    const wanted = A.ACTIONS.filter((a) => settings.enabled[a.id] && A.isRunnable(a));
    if (!wanted.length) return {ok: false, error: 'Select at least one action first.'};

    // Nothing runnable yet means every selected action still has to be found in the AddMeFast menu.
    const first = A.nextAction(null, settings, discovered);
    const url = first ? A.urlFor(first, discovered) : A.BASE + DISCOVERY_PATH;

    let tab = await findControllerTab();
    if (!tab) tab = await chrome.tabs.create({url: 'about:blank', active: true});

    const stale = await updateRuntime((rt) => {
        const oldTask = rt.taskTabId;
        Object.assign(rt, freshRuntime(), {running: true, controllerTabId: tab.id, startedAt: Date.now()});
        setStatus(rt, 'Starting…');
        return oldTask;
    });
    if (stale != null) chrome.tabs.remove(stale).catch(() => {});
    await chrome.storage.session.set({log: []});
    await addLog('Started');
    await chrome.alarms.clear(TASK_ALARM);
    await chrome.tabs.update(tab.id, {url, active: true});
    return {ok: true};
}

async function stop(text = 'Stopped', level = 'info') {
    const tabs = await updateRuntime((rt) => {
        const snapshot = {controller: rt.controllerTabId, task: rt.taskTabId, wasRunning: rt.running};
        rt.running = false;
        rt.taskTabId = null;
        rt.currentAction = null;
        rt.taskResult = null;
        setStatus(rt, text, level);
        return snapshot;
    });
    await chrome.alarms.clear(TASK_ALARM);
    tell(tabs.controller, {type: 'stop'});
    if (tabs.task != null) chrome.tabs.remove(tabs.task).catch(() => {});
    if (tabs.wasRunning) await addLog(text, level);
    return {ok: true};
}

// ---------------------------------------------------------------- task tab lifecycle

async function adoptTaskTab(tabId, openerTabId) {
    if (tabId == null || openerTabId == null) return;
    const result = await updateRuntime((rt) => {
        if (!rt.running || openerTabId !== rt.controllerTabId) return null;
        if (tabId === rt.controllerTabId || tabId === rt.taskTabId) return null;
        const stale = rt.taskTabId;
        rt.taskTabId = tabId;
        rt.taskResult = null;
        return {stale, controller: rt.controllerTabId};
    });
    if (!result) return;
    if (result.stale != null) chrome.tabs.remove(result.stale).catch(() => {});
    chrome.alarms.create(TASK_ALARM, {delayInMinutes: TASK_TIMEOUT_MINUTES});
    tell(result.controller, {type: 'taskOpened'});
}

async function onTaskTabClosed() {
    await chrome.alarms.clear(TASK_ALARM);
    const settings = await getSettings();
    const outcome = await updateRuntime((rt) => {
        const actionId = rt.currentAction;
        const result = rt.taskResult || {status: 'timeout', detail: 'the page never reported a result'};
        const bucket = result.status === 'done' ? 'done' : result.status === 'already' ? 'already' : 'failed';
        rt.taskTabId = null;
        rt.taskResult = null;
        rt.session[bucket]++;
        const limitHit = settings.sessionLimit > 0 && rt.session.tasks >= settings.sessionLimit;
        return {actionId, result, bucket, controller: rt.controllerTabId, limitHit, running: rt.running};
    });

    if (outcome.actionId) {
        await locked(async () => {
            const stats = await getStats();
            const row = stats[outcome.actionId] || {done: 0, already: 0, failed: 0};
            row[outcome.bucket]++;
            stats[outcome.actionId] = row;
            await chrome.storage.local.set({stats});
        });
        const detail = outcome.result.detail ? ' (' + outcome.result.detail + ')' : '';
        await addLog(describe(outcome.actionId) + ': ' + outcome.result.status.replace('_', ' ') + detail,
            outcome.bucket === 'failed' ? 'warn' : 'info');
    }

    if (!outcome.running) return;
    if (outcome.limitHit) {
        await stop('Session limit reached', 'info');
        return;
    }
    tell(outcome.controller, {type: 'taskClosed'});
}

chrome.tabs.onCreated.addListener((tab) => {
    adoptTaskTab(tab.id, tab.openerTabId);
});

// Second, independent signal for the same event: covers pop-up windows whose tab arrives without an opener id.
chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
    adoptTaskTab(details.tabId, details.sourceTabId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    const rt = await getRuntime();
    if (tabId === rt.taskTabId) {
        await onTaskTabClosed();
    } else if (tabId === rt.controllerTabId && rt.running) {
        await stop('Stopped: the AddMeFast tab was closed', 'warn');
    }
});

// The controller tab wandered off to another site. Nothing can run there, so say why it is quiet;
// the loop picks up by itself as soon as the tab is back on AddMeFast.
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    const rt = await getRuntime();
    if (!rt.running || details.tabId !== rt.controllerTabId) return;
    let host = '';
    try {
        host = new URL(details.url).hostname;
    } catch (e) {
        return;
    }
    if (host === 'addmefast.com' || host.endsWith('.addmefast.com')) return;
    const text = 'Paused: the bot tab is not on addmefast.com. Go back to AddMeFast in that tab to continue.';
    const changed = await updateRuntime((runtime) => {
        const isNew = runtime.status.text !== text;
        setStatus(runtime, text, 'warn');
        return isNew;
    });
    if (changed) await addLog(text, 'warn');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== TASK_ALARM) return;
    const rt = await getRuntime();
    if (rt.taskTabId != null) chrome.tabs.remove(rt.taskTabId).catch(() => {});
});

// ---------------------------------------------------------------- messages

const handlers = {
    // --- popup (extension pages only)
    async getState() {
        const [settings, runtime, stats, log, discovered] = await Promise.all(
            [getSettings(), getRuntime(), getStats(), getLog(), getDiscovered()]);
        return {settings, runtime, stats, log, discovered};
    },
    async saveSettings(msg) {
        const settings = A.mergeSettings(msg.settings);
        await chrome.storage.local.set({settings});
        const rt = await getRuntime();
        if (rt.running) tell(rt.controllerTabId, {type: 'settings', settings});
        return {ok: true, settings};
    },
    start,
    stop() {
        return stop('Stopped');
    },
    async resetStats() {
        await chrome.storage.local.set({stats: {}});
        return {ok: true};
    },

    // --- controller tab
    async hello(msg, sender) {
        const rt = await getRuntime();
        if (!rt.running || sender.tab.id !== rt.controllerTabId) return {running: false};
        return {
            running: true,
            settings: await getSettings(),
            discovered: await getDiscovered(),
            emptyStreak: rt.emptyStreak,
            taskOpen: rt.taskTabId != null,
        };
    },
    async discovered(msg) {
        const paths = msg.paths || {};
        if (!Object.keys(paths).length) return {discovered: await getDiscovered()};
        return locked(async () => {
            const discovered = Object.assign(await getDiscovered(), paths);
            await chrome.storage.local.set({discovered});
            return {discovered};
        });
    },
    async taskStart(msg) {
        if (!A.getAction(msg.actionId)) return {ok: false};
        await updateRuntime((rt) => {
            rt.currentAction = msg.actionId;
            rt.taskResult = null;
            rt.emptyStreak = 0;
            rt.session.tasks++;
            setStatus(rt, 'Working: ' + describe(msg.actionId));
        });
        return {ok: true};
    },
    async empty() {
        return updateRuntime((rt) => ({emptyStreak: ++rt.emptyStreak}));
    },
    async status(msg) {
        const text = String(msg.text || '').slice(0, 200);
        const level = msg.level === 'warn' || msg.level === 'error' ? msg.level : 'info';
        const changed = await updateRuntime((rt) => {
            const isNew = rt.status.text !== text;
            setStatus(rt, text, level);
            return isNew;
        });
        if (changed && (msg.log || level !== 'info')) await addLog(text, level);
        return {ok: true};
    },
    async finished(msg) {
        return stop(String(msg.text || 'Finished').slice(0, 200), msg.level === 'warn' ? 'warn' : 'info');
    },

    // --- task tab
    async taskHello(msg, sender) {
        const rt = await getRuntime();
        const settled = rt.taskResult && (rt.taskResult.status === 'done' || rt.taskResult.status === 'already');
        if (!rt.running || sender.tab.id !== rt.taskTabId || !rt.currentAction || settled) return {actionId: null};
        return {actionId: rt.currentAction};
    },
    async taskResult(msg, sender) {
        await updateRuntime((rt) => {
            if (sender.tab.id !== rt.taskTabId) return;
            rt.taskResult = {
                status: String(msg.status || 'error').slice(0, 30),
                detail: String(msg.detail || '').slice(0, 120),
            };
        });
        return {ok: true};
    },
    async taskClose(msg, sender) {
        const rt = await getRuntime();
        if (sender.tab.id === rt.taskTabId) chrome.tabs.remove(sender.tab.id).catch(() => {});
        return {ok: true};
    },
};

const POPUP_ONLY = new Set(['getState', 'saveSettings', 'start', 'stop', 'resetStats']);
const CONTROLLER_ONLY = new Set(['discovered', 'taskStart', 'empty', 'status', 'finished']);

async function dispatch(msg, sender) {
    const type = msg && msg.type;
    const handler = Object.prototype.hasOwnProperty.call(handlers, type) ? handlers[type] : null;
    if (!handler || sender.id !== chrome.runtime.id) return {error: 'unknown message'};

    // The popup is an extension page (also when it is opened in a tab); everything else comes from a content script.
    const fromExtensionPage = typeof sender.url === 'string' && sender.url.startsWith(chrome.runtime.getURL(''));
    const fromTab = !!(sender.tab && sender.tab.id != null);
    if (POPUP_ONLY.has(type)) {
        if (!fromExtensionPage) return {error: 'not allowed'};
    } else if (fromExtensionPage || !fromTab) {
        return {error: 'not allowed'};
    }
    if (CONTROLLER_ONLY.has(type)) {
        const rt = await getRuntime();
        if (!rt.running || sender.tab.id !== rt.controllerTabId) return {error: 'not the controller tab'};
    }
    return handler(msg, sender);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    dispatch(msg, sender).then(sendResponse, (e) => sendResponse({error: String((e && e.message) || e)}));
    return true;
});

getRuntime().then(updateBadge);
