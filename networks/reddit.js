(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // New Reddit keeps both buttons inside shadow roots; d.first() looks through them.
    const JOIN = ['shreddit-join-button button', 'button.join-btn', 'button[data-post-click-location="join"]', 'button[data-testid="subscribe-button"]'];

    AMF.handlers.reddit_follow = () => d.clickOnce({
        target: () => d.first(JOIN, (el) => /^join$/i.test(d.text(el))) || d.byText('button', /^join$/i),
        already: () => d.first(JOIN, (el) => /^(joined|leave)$/i.test(d.text(el))),
    });

    function postUpvote() {
        const post = document.querySelector('shreddit-post');
        if (post && post.shadowRoot) {
            const inPost = post.shadowRoot.querySelector('button[upvote]');
            if (inPost) return inPost;
        }
        // Fallbacks: any upvote control on the page, then old.reddit.com's arrow.
        return d.first(['button[upvote]', 'button[aria-label="upvote" i]', '.thing.link .arrow.up, .thing.link .arrow.upmod']);
    }

    const isUpvoted = (el) => d.pressed(el) || el.classList.contains('upmod');

    AMF.handlers.reddit_like = () => d.clickOnce({
        target: () => {
            const el = postUpvote();
            return el && !isUpvoted(el) ? el : null;
        },
        already: () => {
            const el = postUpvote();
            return el && isUpvoted(el);
        },
    });
})(globalThis.AMF);
