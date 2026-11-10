(function (AMF) {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const send = (message) => chrome.runtime.sendMessage(message).catch((e) => ({error: String((e && e.message) || e)}));

    let state = null;
    let localError = '';
    let clock = null;

    function el(tag, props, children) {
        const node = Object.assign(document.createElement(tag), props || {});
        for (const child of [].concat(children || [])) node.append(child);
        return node;
    }

    // ---------------------------------------------------------------- settings

    function readSettings() {
        const enabled = {};
        for (const box of document.querySelectorAll('#networks input[type="checkbox"]')) {
            enabled[box.dataset.action] = box.checked;
        }
        return AMF.mergeSettings({enabled, max: $('max').value, sessionLimit: $('session-limit').value});
    }

    let saveTimer = null;

    function saveSoon() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(save, 250);
    }

    async function save() {
        clearTimeout(saveTimer);
        const reply = await send({type: 'saveSettings', settings: readSettings()});
        if (reply && reply.settings && state) state.settings = reply.settings;
    }

    // ---------------------------------------------------------------- rendering

    function hint(action, discovered) {
        if (action.status === 'unavailable') return action.note || 'Not supported';
        if (action.status === 'experimental') {
            return AMF.pathFor(action, discovered)
                ? 'Experimental: not yet confirmed on a live account'
                : 'Experimental: looked up in the AddMeFast menu when you press Start';
        }
        return '';
    }

    function renderNetworks() {
        const {settings, discovered} = state;
        const cards = AMF.NETWORKS.map((network) => {
            const actions = AMF.ACTIONS.filter((a) => a.network === network.id);
            const rows = actions.map((action) => {
                const runnable = AMF.isRunnable(action);
                const box = el('input', {type: 'checkbox', checked: !!settings.enabled[action.id], disabled: !runnable});
                box.dataset.action = action.id;
                box.addEventListener('change', saveSoon);
                const row = el('label', {className: runnable ? '' : 'off', title: hint(action, discovered)}, [box, action.label]);
                if (action.status === 'experimental') row.append(el('span', {className: 'tag', textContent: 'beta'}));
                if (!runnable) row.append(el('span', {className: 'tag', textContent: 'n/a'}));
                return row;
            });
            const link = el('a', {href: network.url, target: '_blank', rel: 'noopener', textContent: network.name});
            return el('section', {className: 'network'}, [el('h2', {}, link), ...rows]);
        });
        $('networks').replaceChildren(...cards);
    }

    function formatDuration(ms) {
        const total = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = String(total % 60).padStart(2, '0');
        return h ? h + ':' + String(m).padStart(2, '0') + ':' + s : m + ':' + s;
    }

    function renderRuntime() {
        const {runtime} = state;
        const toggle = $('toggle');
        toggle.textContent = runtime.running ? 'Stop' : 'Start';
        toggle.classList.toggle('running', runtime.running);
        toggle.disabled = false;

        const warn = !!localError || runtime.status.level !== 'info';
        $('status').className = 'status' + (warn ? ' warn' : runtime.running ? ' running' : '');
        $('status-text').textContent = localError || runtime.status.text;

        $('c-done').textContent = runtime.session.done;
        $('c-already').textContent = runtime.session.already;
        $('c-failed').textContent = runtime.session.failed;

        clearInterval(clock);
        const showTime = () => {
            $('c-time').textContent = runtime.running ? formatDuration(Date.now() - runtime.startedAt) : '0:00';
        };
        showTime();
        if (runtime.running) clock = setInterval(showTime, 1000);
    }

    function renderLog() {
        const items = state.log.slice().reverse().map((entry) => el('li', {className: entry.level}, [
            el('time', {textContent: new Date(entry.at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}),
            el('span', {textContent: entry.text}),
        ]));
        $('log').replaceChildren(...(items.length ? items : [el('li', {className: 'empty', textContent: 'Nothing yet.'})]));
    }

    function renderStats() {
        const rows = AMF.ACTIONS
            .filter((a) => state.stats[a.id])
            .map((a) => {
                const s = state.stats[a.id];
                const network = AMF.NETWORKS.find((n) => n.id === a.network);
                return el('tr', {}, [
                    el('td', {textContent: network.name + ' · ' + a.label}),
                    el('td', {textContent: s.done}),
                    el('td', {textContent: s.already}),
                    el('td', {textContent: s.failed}),
                ]);
            });
        if (!rows.length) {
            $('stats').replaceChildren(el('tr', {}, el('td', {className: 'empty', textContent: 'No tasks recorded yet.'})));
            return;
        }
        const head = el('tr', {}, ['Action', 'Done', 'Already', 'Failed'].map((t) => el('th', {textContent: t})));
        $('stats').replaceChildren(head, ...rows);
    }

    async function refresh(full) {
        const reply = await send({type: 'getState'});
        if (!reply || reply.error) {
            $('status').className = 'status warn';
            $('status-text').textContent = 'Extension is not responding. Reload it from chrome://extensions.';
            return;
        }
        state = reply;
        if (full) {
            $('max').value = state.settings.max;
            $('session-limit').value = state.settings.sessionLimit;
            renderNetworks();
        }
        renderRuntime();
        renderLog();
        renderStats();
    }

    // ---------------------------------------------------------------- events

    $('toggle').addEventListener('click', async () => {
        if (!state) return;
        const toggle = $('toggle');
        toggle.disabled = true;
        localError = '';
        if (state.runtime.running) {
            await send({type: 'stop'});
        } else {
            await save();
            const reply = await send({type: 'start'});
            if (reply && reply.ok === false) localError = reply.error;
            if (reply && reply.error && reply.ok === undefined) localError = reply.error;
        }
        await refresh(false);
    });

    // "All" switches on the confirmed actions only; beta ones stay a deliberate, per-action choice.
    function setAll(checked) {
        for (const box of document.querySelectorAll('#networks input[type="checkbox"]:not(:disabled)')) {
            const action = AMF.getAction(box.dataset.action);
            if (checked && action.status !== 'stable') continue;
            box.checked = checked;
        }
        saveSoon();
    }

    $('all').addEventListener('click', () => setAll(true));
    $('none').addEventListener('click', () => setAll(false));
    $('max').addEventListener('change', saveSoon);
    $('session-limit').addEventListener('change', saveSoon);

    $('reset-stats').addEventListener('click', async (event) => {
        event.preventDefault();
        await send({type: 'resetStats'});
        await refresh(false);
    });

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'session' && (changes.runtime || changes.log)) refresh(false);
        if (area === 'local' && changes.stats) refresh(false);
        if (area === 'local' && changes.discovered) refresh(true);
    });

    $('version').textContent = 'v' + chrome.runtime.getManifest().version;
    refresh(true);
})(globalThis.AMF);
