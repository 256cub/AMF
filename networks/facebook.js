(function (AMF) {
    'use strict';
    const d = AMF.dom;

    const control = (name) => d.first('[role="button"][aria-label="' + name + '"], button[aria-label="' + name + '"]');
    const anyControl = (...names) => names.map(control).find(Boolean) || null;

    // A page offers either "Like" or "Follow". The old script also clicked "Following", which unfollowed.
    AMF.handlers.fb_page_like = () => d.clickOnce({
        target: () => anyControl('Like', 'Follow'),
        already: () => !anyControl('Like', 'Follow') && anyControl('Liked', 'Unlike', 'Remove Like', 'Following'),
    });

    AMF.handlers.fb_follow = () => d.clickOnce({
        target: () => control('Follow') || d.byText('[role="button"]', /^follow$/i),
        already: () => !control('Follow') && control('Following'),
    });

    AMF.handlers.fb_post_like = () => d.clickOnce({
        target: () => control('Like'),
        already: () => !control('Like') && anyControl('Remove Like', 'Unlike'),
    });

    // Share dialog (sharer.php): a single confirm button.
    AMF.handlers.fb_share = () => d.clickOnce({
        target: () => d.first('button[name="__CONFIRM__"]')
            || d.byText('button, [role="button"]', /^(post to facebook|share|post)$/i),
        settle: 3000,
    });

    // Sharing a post takes two steps: open the share menu, then pick "Share now".
    AMF.handlers.fb_post_share = async () => {
        const opener = await d.waitFor(() => control('Send this to friends or post it on your profile.')
            || d.byText('[role="button"]', /^share$/i));
        if (!opener) return d.loginWall() ? d.result.login() : d.result.notFound('share button not found');
        d.click(opener);

        const confirm = await d.waitFor(() => d.byText('[role="button"], [role="menuitem"]', /^share now/i), 10000);
        if (!confirm) return d.result.notFound('"Share now" did not appear');
        d.click(confirm);
        await d.sleep(2500);
        return d.result.done();
    };
})(globalThis.AMF);
