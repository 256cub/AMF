(function (AMF) {
    'use strict';
    const d = AMF.dom;

    // AddMeFast opens intent links, which show a confirmation sheet. X also has two generations of
    // markup live (data-testid based and aria-label based), so every lookup covers both.
    const sheetConfirm = () => d.first('[data-testid="confirmationSheetConfirm"]');
    const engagement = (word) => d.first('button[aria-label]', (el) => new RegExp('(^|\\. )' + word + '$', 'i').test(d.label(el)));

    AMF.handlers.twitter_follow = () => d.clickOnce({
        target: () => sheetConfirm()
            || d.first('[data-testid$="-follow"]')
            || d.byText('button', /^follow( back)?$/i),
        already: () => !sheetConfirm() && (d.first('[data-testid$="-unfollow"]') || d.byText('button', /^(following|pending)$/i)),
    });

    AMF.handlers.twitter_like = () => d.clickOnce({
        target: () => sheetConfirm() || d.first('[data-testid="like"]') || (() => {
            const el = engagement('like');
            return el && !d.pressed(el) ? el : null;
        })(),
        already: () => !sheetConfirm() && (d.first('[data-testid="unlike"]') || d.pressed(engagement('liked?'))),
    });

    AMF.handlers.twitter_retweet = async () => {
        const hit = await d.waitFor(() => {
            const sheet = sheetConfirm();
            if (sheet) return {sheet};
            if (d.first('[data-testid="unretweet"]') || d.pressed(engagement('repost(ed)?'))) return {already: true};
            const menu = d.first('[data-testid="retweet"]') || engagement('repost');
            return menu ? {menu} : null;
        });
        if (!hit) return d.loginWall() ? d.result.login() : d.result.notFound();
        if (hit.already) return d.result.already();
        if (hit.sheet) {
            d.click(hit.sheet);
            await d.sleep(1500);
            return d.result.done();
        }

        // No sheet: open the repost menu and pick the plain repost entry.
        const findItem = () => d.first('[data-testid="retweetConfirm"]') || d.byText('[role="menuitem"]', /^repost$/i);
        d.click(hit.menu);
        let item = await d.waitFor(findItem, 3000);
        if (!item) {
            d.press(hit.menu); // some builds open the menu on press rather than on click
            item = await d.waitFor(findItem, 3000);
        }
        if (!item) return d.result.notFound('repost menu did not open');
        d.click(item);
        await d.sleep(1500);
        return d.result.done();
    };

    AMF.handlers.twitter_tweet = () => d.clickOnce({
        target: () => d.first(['[data-testid="tweetButton"]', '[data-testid="tweetButtonInline"]'], (el) => el.getAttribute('aria-disabled') !== 'true')
            || d.byText('button', /^(post|tweet)$/i),
        settle: 3000,
    });
})(globalThis.AMF);
