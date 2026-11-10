/*
 * DOM helpers shared by the network handlers. Queries walk open shadow roots because several
 * sites (Reddit, YouTube) render their buttons inside web components.
 */
(function (root) {
    'use strict';

    const AMF = root.AMF = root.AMF || {};

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /** querySelectorAll across the document and every open shadow root, in document order. */
    function all(selector, scope) {
        const out = [];
        const visit = (node) => {
            let matches;
            try {
                matches = node.querySelectorAll(selector);
            } catch (e) {
                return; // invalid selector: treat as no match instead of breaking the handler
            }
            out.push(...matches);
            for (const el of node.querySelectorAll('*')) {
                if (el.shadowRoot) visit(el.shadowRoot);
            }
        };
        visit(scope || document);
        return out;
    }

    function visible(el) {
        if (!el || !el.isConnected) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        if (typeof el.checkVisibility === 'function') {
            return el.checkVisibility({checkOpacity: true, checkVisibilityCSS: true});
        }
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none';
    }

    /** Visible text of an element, whitespace collapsed. */
    function text(el) {
        return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
    }

    function label(el) {
        return el ? (el.getAttribute('aria-label') || el.getAttribute('title') || '').trim() : '';
    }

    /** First visible element matching any selector (tried in order), optionally filtered. */
    function first(selectors, filter) {
        for (const selector of [].concat(selectors)) {
            for (const el of all(selector)) {
                if (visible(el) && (!filter || filter(el))) return el;
            }
        }
        return null;
    }

    /** First visible element under `selector` whose text or aria-label matches `pattern`. */
    function byText(selector, pattern, scope) {
        for (const el of all(selector, scope)) {
            if (!visible(el)) continue;
            if (pattern.test(text(el)) || pattern.test(label(el))) return el;
        }
        return null;
    }

    /** Poll `probe` until it returns something truthy, or resolve null after `timeout` ms. */
    async function waitFor(probe, timeout = 20000, interval = 400) {
        const deadline = Date.now() + timeout;
        for (;;) {
            let value = null;
            try {
                value = probe();
            } catch (e) {
                value = null;
            }
            if (value) return value;
            if (Date.now() >= deadline) return null;
            await sleep(interval);
        }
    }

    function click(el) {
        if (!el) return false;
        try {
            el.scrollIntoView({block: 'center', inline: 'center'});
        } catch (e) { /* not scrollable: click anyway */
        }
        el.click();
        return true;
    }

    /** Pointer and mouse sequence without the click itself, for controls that open on press. */
    function press(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        const init = {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            button: 0,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
        };
        el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({pointerId: 1, pointerType: 'mouse', isPrimary: true}, init)));
        el.dispatchEvent(new MouseEvent('mousedown', init));
        el.dispatchEvent(new PointerEvent('pointerup', Object.assign({pointerId: 1, pointerType: 'mouse', isPrimary: true}, init)));
        el.dispatchEvent(new MouseEvent('mouseup', init));
        return true;
    }

    const pressed = (el) => !!el && el.getAttribute('aria-pressed') === 'true';

    /** Sites show this when the visitor is signed out; the action cannot count then. */
    function loginWall() {
        return !!first([
            'input[type="password"]',
            'form[action*="login" i]',
        ]);
    }

    const result = {
        done: (detail) => ({status: 'done', detail: detail || ''}),
        already: (detail) => ({status: 'already', detail: detail || ''}),
        notFound: (detail) => ({status: 'not_found', detail: detail || 'button not found'}),
        login: () => ({status: 'login_required', detail: 'sign in to this network first'}),
    };

    /**
     * The shape almost every action has: wait for either the "do it" control or proof that it is
     * already done, click once, then check whether the page asked for a login instead.
     *
     *   target()  -> element to click, or null
     *   already() -> truthy when the action was done before (never click then: it would undo it)
     */
    async function clickOnce({target, already, timeout, settle = 1500}) {
        const hit = await waitFor(() => {
            if (already && already()) return {already: true};
            const el = target();
            return el ? {el} : null;
        }, timeout);
        if (!hit) return loginWall() ? result.login() : result.notFound();
        if (hit.already) return result.already();
        AMF.dom.click(hit.el);
        await sleep(settle);
        if (loginWall()) return result.login();
        return result.done();
    }

    AMF.dom = {sleep, all, visible, text, label, first, byText, waitFor, click, press, pressed, loginWall, result, clickOnce};
    AMF.handlers = AMF.handlers || {};
})(typeof globalThis !== 'undefined' ? globalThis : this);
