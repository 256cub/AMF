<a name="top"></a>

# AMF Bot

Chrome extension that works through the free-points tasks on [AddMeFast.com](https://amf.ac/?RZGV0W6M) for you: it opens each task, presses the like / follow / subscribe button on the network's page, closes the window and moves on.

- Support and questions: [AMF Discord Server](https://discord.gg/2qShbF5xmK)
- Bugs and ideas: [GitHub issues](https://github.com/256cub/AMF/issues/new)

---

## What is new in 2.0

Version 2.0 is a rewrite. The old version stopped loading in current Chrome (Manifest V2 is no longer supported) and had several bugs that could not be patched one by one.

- **Works in current Chrome.** Manifest V3, service worker, no jQuery or Bootstrap.
- **Only touches its own tabs.** The bot runs in one AddMeFast tab and acts only in the task windows that tab opens. Your other tabs are never redirected, clicked or closed. (Before, pressing Start sent every open tab to AddMeFast, and any open YouTube or Facebook tab could be acted on.)
- **Settings are saved.** Selected actions and limits survive closing the popup and restarting the browser.
- **Never undoes an action.** Each handler checks whether the like / follow is already there before clicking, so a liked video is no longer un-liked.
- **Updated for today's sites.** New selectors for YouTube, Reddit (shadow DOM), X (both `twitter.com` and `x.com`, "Repost"), TikTok, Instagram, Twitch, SoundCloud, CoinMarketCap and ReverbNation.
- **Tells you what it is doing.** Live status, a per-session counter, an activity log and lifetime totals per action.
- **Stops when it should.** Optional task limit per session, a watchdog that closes stuck task windows, and a slow-down when AddMeFast has no tasks instead of reloading pages in a loop.
- **Pauses instead of breaking** when AddMeFast shows a security check or the login page, and continues when you have dealt with it.
- **New (beta):** Pinterest follow / save, VK group / page, OK.ru group join.

---

## Install

1. Download this repository (green **Code** button, then **Download ZIP**) and unzip it, or `git clone` it.
2. Open `chrome://extensions` in Chrome (or another Chromium browser: Edge, Brave, Opera).
3. Switch on **Developer mode** (top right).
4. Click **Load unpacked** and choose the unzipped folder (the one that contains `manifest.json`).

To update: `git pull` (or download the ZIP again into the same folder), then press the reload arrow on the extension card in `chrome://extensions`.

## Use

1. Log in to [AddMeFast](https://amf.ac/?RZGV0W6M) and to every social network you want to use, in the same browser profile.
2. Click the extension icon and tick the actions you want.
3. Set **Max clicks per type** (how many tasks of one kind before moving to the next kind) and, if you like, **Stop after** (total tasks for this run, `0` means no limit).
4. Press **Start**. The bot uses your open AddMeFast tab, or opens one.
5. Press **Stop** at any time. Closing the AddMeFast tab also stops it.

The first time, Chrome may block the task window. If the status says so, click the pop-up icon at the right end of the address bar on addmefast.com and choose **Always allow pop-ups**.

---

## Supported actions

| Network | Actions | State |
|---|---|---|
| YouTube | Subscribe, Like | supported |
| Facebook | Page like, Follow, Post like, Share, Post share | supported |
| Instagram | Follow, Like | supported |
| TikTok | Follow, Like | supported |
| X / Twitter | Follow, Like, Repost, Post | supported |
| Reddit | Join, Upvote | supported |
| SoundCloud | Follow, Like | supported |
| Twitch | Follow | supported |
| CoinMarketCap | Watchlist | supported |
| Likee | Follow | supported |
| ReverbNation | Fan | supported |
| Pinterest | Follow, Save | beta |
| VK | Group, Page | beta |
| OK.ru | Group join | beta |
| YouTube views, SoundCloud plays | | not possible: AddMeFast asks for a captcha each time |
| Telegram | Channel | not possible from a browser extension |
| Website hits | | not automated |

**Beta** means the code is there but has not been confirmed with a real AddMeFast account. For Pinterest and VK the extension finds the task page in the AddMeFast menu when you press Start; if AddMeFast does not offer that task to your account, the action is skipped. Please report how they behave.

---

## Troubleshooting

**Nothing happens after Start.** Read the status line in the popup. It names the reason: not logged in, pop-ups blocked, security check, or no tasks available.

**The button is clicked but AddMeFast gives no points.** The extension did its part; AddMeFast did not accept the action. This usually depends on the social account (too new, too many recent likes or follows, action limits on the network). Log out of that network, log in again, or use another account for it.

**"failed" in the counters.** Open **Activity** in the popup for the reason of each task: `not found` means the page did not show the expected button (the profile or post may be gone, or the site changed its layout), `login required` means you are signed out of that network, `timeout` means the page never finished loading.

**AddMeFast shows a Cloudflare / "verify you are human" page.** Complete it yourself in the bot tab. The bot waits and continues afterwards. It does not try to get around the check.

**A network stopped working after a site redesign.** Open an issue with the network, the action, and the line from **Activity**.

### About bans

AddMeFast does not allow automation, and it can suspend accounts that use it. The social networks have their own rules about automated likes and follows as well. This extension cannot prevent, detect or undo a ban, and nothing in it is designed to hide from those checks. You use it at your own risk.

---

## How it works

- `shared/actions.js` is the single list of networks, actions and AddMeFast task pages.
- `background.js` (service worker) keeps the state and decides which tabs belong to the bot: the controller tab on AddMeFast, and the task tab that the controller tab opened.
- `content/controller.js` runs on addmefast.com and presses the task button.
- `content/task.js` and `networks/*.js` run on the social networks. They ask the service worker first and do nothing unless the tab is the current task tab.
- `popup/` is the control panel.

The extension has no server, sends no data anywhere and asks only for the `storage`, `alarms` and `webNavigation` permissions plus access to the sites it works on.

### Development

```bash
npm test             # unit tests, no dependencies
npm install          # only needed for the two browser tests below
npm run test:e2e     # loads the extension in Chromium against local mock pages
npm run test:live    # checks every handler against the real public pages (clicks are stubbed)
```

The browser tests need a Chromium build: `npx playwright-core install chromium`, or point `CHROME_PATH` at one.

To add an action: add it to `shared/actions.js`, write its handler in `networks/<network>.js`, list the script and the site in `manifest.json`. `npm test` fails if an action has no handler.

---

## Release history

- **2.0.0**
  - rewritten for Manifest V3
  - the bot only acts in its own AddMeFast tab and the task windows it opens
  - settings are stored; live status, activity log and totals in the popup
  - session task limit, task watchdog, back-off when no tasks are available
  - pauses on security checks and on the login page
  - handlers updated for YouTube, Reddit, X, TikTok, Instagram, Twitch, SoundCloud, CoinMarketCap, ReverbNation
  - beta: Pinterest, VK, OK.ru
  - fixed: `data is not defined` on startup, invalid `:contains()` selectors that broke Reddit / TikTok / Twitch follow, Twitter post crash, Facebook page like un-following pages, TikTok like being removed again
- **1.0.3**
  - added link to each social network in the popup
  - added random wait time for all actions
- **1.0.2**
  - added Twitter Tweet / Retweet, Facebook Share / Follow / Post Share
  - fixed bugs related to redirecting to the main page
  - fixed Reddit / YouTube / SoundCloud
- **1.0.1**
  - added CoinMarketCap Watch, Twitch Follow, Likee Follow, ReverbNation Follow
- **1.0.0**
  - first release

---

## Contributing

Contributions are welcome. Fork the repository, create a branch, and open a pull request. For a broken network, the most useful thing to include is the line from **Activity** and the address of the page it failed on.

## Security

If you discover a security issue, please email 256cub@gmail.com instead of using the issue tracker.

## Buy Me a Coffee

This project will always be open source, even without donations. If you still want to show your appreciation:

<a href="https://www.buymeacoffee.com/256cub" target="_blank">
<img src="https://cdn.buymeacoffee.com/buttons/arial-orange.png" alt="Buy Me A Coffee" style="height: 51px !important;width: 217px !important;" ></a>

|   Donate With   |                      Address                       |
|:---------------:|:--------------------------------------------------:|
|      Ko-fi      |       [Click Here](https://ko-fi.com/256cub)       |
|     PayPal      | [Click Here](https://paypal.me/256cub) |
|   BTC Address   |         3MsUYeUfmpwVS2QrnRbLpCjGaVn2WDD6sj         |
|   ETH Address   |     0x10cd16ba338661d2FB683B2481f8F5000FEd5663     |

## Credits

- [256cub](https://github.com/256cub)

## License

The MIT License (MIT). Please see [License File](LICENSE) for more information.

<p align="right">(<a href="#top">back to top</a>)</p>
