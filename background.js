/*
    Firefox addon "Undo Close Tab"
    Copyright (C) 2019  Manuel Reimer <manuel.reimer@gmx.de>
    Copyright (C) 2017  YFdyh000 <yfdyh000@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Function to do all this "Promise" stuff required by the WebExtensions API.
// Finally returns a Promise which will be resolved with a list of closed tabs.
async function GetLastClosedTabs(aMaxResults, aOnlyCurrent) {
  try {
    const currentWindow = await browser.windows.getCurrent();
    const sessions = await browser.sessions.getRecentlyClosed();
    let tabs = sessions.filter((s) => (s.tab && (!aOnlyCurrent || s.tab.windowId === currentWindow.id)));
    if (aMaxResults && tabs.length > aMaxResults)
      tabs = tabs.splice(0, aMaxResults);
    tabs.forEach((o, i, a) => {a[i] = a[i].tab});
    return tabs;
  } catch (error) {
    // Simple error handler. Just logs the error to console.
    console.log(error);
  }
}


// Fired if the toolbar button is clicked.
// Restores the last closed tab in list.
async function ToolbarButtonClicked() {
  const tabs = await GetLastClosedTabs(false, true);
  if (tabs.length > 0)
    await browser.sessions.restore(tabs[0].sessionId);
}

// Fired if the window focus changed. This function acts as a filter.
// The unfiltered calls get forwarded to "ClosedTabListChanged()".
function WindowFocusChanged(aWindowId) {
  // We aren't interested in "unfocus" events
  if (aWindowId == browser.windows.WINDOW_ID_NONE)
    return;

  // We are only interested in real window switches. No double calls!
  if (typeof WindowFocusChanged.lastwindow == 'undefined')
    WindowFocusChanged.lastwindow = browser.windows.WINDOW_ID_NONE;
  if (aWindowId == WindowFocusChanged.lastwindow)
    return;
  WindowFocusChanged.lastwindow = aWindowId;

  // Finally continue in "ClosedTabListChanged()"
  ClosedTabListChanged();
}

// Fired if the list of closed tabs has changed.
// Updates the context menu entries with the list of last closed tabs.
async function ClosedTabListChanged() {
  await browser.contextMenus.removeAll();
  const prefs = await Storage.get();

  const tabs = await GetLastClosedTabs(prefs.showNumber, prefs.onlyCurrent);
  const max_allowed = browser.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT - (prefs.showClearList ? 1 : 0);

  // This block is for creating the "page" or "tab" context menus.
  // They are only drawn if at least one tab can be restored.
  if ((prefs.showTabMenu || prefs.showPageMenu) && tabs.length) {
    let contexts = [];
    if (prefs.showTabMenu)
      contexts.push("tab");
    if (prefs.showPageMenu)
      contexts.push("page");

    let rootmenu = browser.contextMenus.create({
      id: "RootMenu",
      title: browser.i18n.getMessage("page_contextmenu_submenu"),
      contexts: contexts
    });

    tabs.forEach((tab) => {
      browser.contextMenus.create({
        id: "PM:" + tab.sessionId,
        title: tab.title,
        icons: {18: tab.favIconUrl || "icons/no-favicon.svg"},
        contexts: contexts,
        parentId: rootmenu
      });
    });

    if (prefs.showClearList) {
      browser.contextMenus.create({
        id: "ClearListSeparator",
        type: "separator",
        contexts: contexts,
        parentId: rootmenu
      });
      browser.contextMenus.create({
        id: "PM:ClearList",
        title: browser.i18n.getMessage("clearlist_menuitem"),
        contexts: contexts,
        parentId: rootmenu
      });
    }
  }

  if (prefs.showPageMenuitem) {
    browser.contextMenus.create({
      id: "UndoCloseTab",
      title: browser.i18n.getMessage("extensionName"),
      contexts: ["page"]
    });
  }

  // If closed tabs count is less or equal maximum allowed menu entries, then
  // no "More items" menu is needed.
  if (tabs.length <= max_allowed) {
    tabs.forEach((tab) => {
      browser.contextMenus.create({
        id: "BA:" + tab.sessionId,
        title: tab.title,
        icons: {18: tab.favIconUrl || "icons/no-favicon.svg"},
        contexts: ["browser_action"]
      });
    });
  }
  // If there are too much items, place "maximum - 1" items to the top level
  // and place the rest of them into a submenu.
  else {
    tabs.splice(0, max_allowed - 1).forEach((tab) => {
      browser.contextMenus.create({
        id: "BA:" + tab.sessionId,
        title: tab.title,
        icons: {18: tab.favIconUrl || "icons/no-favicon.svg"},
        contexts: ["browser_action"]
      });
    });

    let moreMenu = browser.contextMenus.create({
      id: "MoreClosedTabs",
      title: browser.i18n.getMessage("more_entries_menu"),
      icons: {18: "icons/folder.svg"},
      contexts: ["browser_action"]
    });

    tabs.forEach((tab) => {
      browser.contextMenus.create({
        id: "BA:" + tab.sessionId,
        title: tab.title,
        icons: {18: tab.favIconUrl || "icons/no-favicon.svg"},
        contexts: ["browser_action"],
        parentId: moreMenu
      });
    });
  }

  if (tabs.length && prefs.showClearList) {
    browser.contextMenus.create({
      id: "BA:ClearList",
      title: browser.i18n.getMessage("clearlist_menuitem"),
      contexts: ["browser_action"],
    });
  }
}

// Fired if one of our context menu entries is clicked.
// Restores the tab, referenced by this context menu entry.
async function ContextMenuClicked(aInfo) {
  if (aInfo.menuItemId == "UndoCloseTab") {
    await ToolbarButtonClicked();
    return;
  }
  if (aInfo.menuItemId.endsWith("ClearList")) {
    const prefs = await Storage.get();
    const tabs = await GetLastClosedTabs(false, prefs.onlyCurrent);
    tabs.forEach((tab) => {
      browser.sessions.forgetClosedTab(tab.windowId, tab.sessionId);
    });
    return;
  }

  const sessionid = aInfo.menuItemId.substring(aInfo.menuItemId.indexOf(":") + 1);
  const session = await browser.sessions.restore(sessionid);
  const currentWindow = await browser.windows.getCurrent();
  if (session.tab.windowId != currentWindow.id)
    browser.windows.update(session.tab.windowId, {focused: true});
}

//
// Android HACKS follow.
// This is no proper replacement for the missing browser.sessions API in
// Firefox for Android but it at least is *something*...
//

// Mozilla doesn't make it too simple for us.
// The problem is that if a tab is closed, the info is already gone.
// So we have to create our own tab info cache.

// This one manages our "cache"
let tabcache = {};
function TabUpdated(aTabId, aChangeInfo) {
  if (aChangeInfo.url !== undefined)
    tabcache[aTabId] = aChangeInfo.url;
}

// This one moves the cached URL over to the tab history list
let tabhistory = [];
function TabClosed(aTabId) {
  if (aTabId in tabcache) {
    tabhistory.push(tabcache[aTabId]);
    delete tabcache[aTabId];
  }
  while (tabhistory.length > 25)
    tabhistory.shift();
}

// And finally: This one pops the last URL from the tab history list and
// creates a new tab with it.
function AndroidToolbarButtonClicked() {
  if (tabhistory.length > 0) {
    const url = tabhistory.pop();
    browser.tabs.create({url: url});
  }
}

//
// Register event listeners
//

// Check for the API we expect for the "full desktop feature set"
// This needs revision as soon as there is some Android browser with
// browser.sessions support.
if (browser.contextMenus !== undefined &&
    browser.windows !== undefined &&
    browser.sessions !== undefined) {
  browser.browserAction.onClicked.addListener(ToolbarButtonClicked);

  browser.windows.onFocusChanged.addListener(WindowFocusChanged);
  browser.sessions.onChanged.addListener(ClosedTabListChanged);
  ClosedTabListChanged();

  browser.contextMenus.onClicked.addListener(ContextMenuClicked);
}
// We did not get the API we need for full features but it is possible to do
// some "session management emulation" with the browser.tabs API.
else if (browser.tabs !== undefined) {
  browser.browserAction.onClicked.addListener(AndroidToolbarButtonClicked);
  browser.tabs.onRemoved.addListener(TabClosed);
  browser.tabs.onUpdated.addListener(TabUpdated);
}

IconUpdater.Init("icons/undoclosetab.svg");
