(function (AMF) {
    'use strict';
    const d = AMF.dom;

    const FOLLOW = ['[data-e2e="follow-button"]', '[data-e2e="browse-follow"]', '[data-e2e="feed-follow"]'];
    const isFollowing = (el) => /^(following|friends|requested|message)$/i.test(d.text(el)) || /^(following|unfollow)/i.test(d.label(el));

    AMF.handlers.tiktok_follow = () => d.clickOnce({
        // The first follow button belongs to the profile/video owner; later ones are suggestions.
        target: () => {
            const el = d.first(FOLLOW) || d.byText('button', /^follow$/i);
            return el && !isFollowing(el) ? el : null;
        },
        already: () => {
            const el = d.first(FOLLOW);
            return el && isFollowing(el);
        },
    });

    const LIKE_ICON = ['[data-e2e="like-icon"]', '[data-e2e="browse-like-icon"]', '[data-e2e="video-like-icon"]'];

    function likeButton() {
        const icon = d.first(LIKE_ICON);
        if (icon) return icon.closest('button') || icon;
        return d.first('button[aria-label*="like" i][aria-pressed]');
    }

    // Clicking a liked video removes the like, so the pressed state is checked before every click.
    AMF.handlers.tiktok_like = () => d.clickOnce({
        target: () => {
            const el = likeButton();
            return el && !d.pressed(el) ? el : null;
        },
        already: () => d.pressed(likeButton()),
        settle: 2500,
    });
})(globalThis.AMF);
