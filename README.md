Undo Close Tab
==============

Note 1: You may run in a Firefox bug which renders Undo Close Tab unusable. If this happens to you, you can follow the following instructions to revive the Addon:
[How to fix broken browser session](https://github.com/M-Reimer/undoclosetab/wiki/How-to-fix-broken-browser-session)

Note 2: The default setting in Firefox is to only store information for a maximum of 10 closed tabs. If you want to reach the maximum of 25 tabs, which again is a [limitation of the WebExtensions API](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/API/sessions/MAX_SESSION_RESULTS), then you have to increase the value of the browser.sessionstore.max_tabs_undo preference via about:config.

---

Main repository: https://github.com/M-Reimer/undoclosetab.

AMO: https://addons.mozilla.org/firefox/addon/undoclosetabbutton/

Localization: https://lusito.github.io/web-ext-translator/?gh=https://github.com/M-Reimer/undoclosetab/

Hacking: Do a [temporary install](https://developer.mozilla.org/Add-ons/WebExtensions/Temporary_Installation_in_Firefox).

Building: [make](https://www.gnu.org/software/make/)
