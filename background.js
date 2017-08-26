/*
    Firefox addon "Undo Close Tab"
    Copyright (C) 2017  Manuel Reimer <manuel.reimer@gmx.de>
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
async function GetLastClosedTabs(aMaxResults) {
  try {
    const currentWindow = await browser.windows.getCurrent();
    const sessions = await browser.sessions.getRecentlyClosed({
      maxResults: aMaxResults
    });
    let tabs = sessions.filter((s) => (s.tab && s.tab.windowId === currentWindow.id));
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
  const tabs = await GetLastClosedTabs();
  if (tabs.length > 0)
    await browser.sessions.restore(tabs[0].sessionId);
}

// Helper function. Creates one context menu entry.
function CreateContextMenuItem(aId, aTitle, aIconUrl, aContexts, aParent) {
  let menuProperty = {
    id: aId,
    title: aTitle,
    contexts: aContexts
  };

  if (aParent)
    menuProperty.parentId = aParent;

  if (MENU_ICONS_SUPPORTED && aIconUrl)
    menuProperty.icons = { 18: aIconUrl };

  return browser.contextMenus.create(menuProperty);
}

// Fired if the list of closed tabs has changed.
// Updates the context menu entries with the list of last closed tabs.
async function ClosedTabListChanged() {
  await browser.contextMenus.removeAll();
  const prefs = await(browser.storage.local.get());
  const showNumber = prefs.showNumber || browser.sessions.MAX_SESSION_RESULTS;
  const showTabMenu = prefs.showTabMenu || false;
  const showPageMenu = prefs.showPageMenu || false;
  const tabs = await GetLastClosedTabs(showNumber);
  let max_allowed = browser.contextMenus.ACTION_MENU_TOP_LEVEL_LIMIT;

  // This block is for creating the "page" or "tab" context menus.
  // They are only drawn if at least one tab can be restored.
  if ((showTabMenu || showPageMenu) && tabs.length) {
    let contexts = [];
    if (showTabMenu)
      contexts.push("tab");
    if (showPageMenu)
      contexts.push("page");

    let rootmenu = CreateContextMenuItem(
      "RootMenu",
      browser.i18n.getMessage("extensionName"),
      false,
      contexts
    );

    tabs.forEach((tab) => {
      CreateContextMenuItem(
        "PM:" + tab.sessionId,
        tab.title,
        tab.favIconUrl,
        contexts,
        rootmenu
      );
    });
  }

  // If closed tabs count is less or equal maximum allowed menu entries, then
  // no "More items" menu is needed.
  if (tabs.length <= max_allowed) {
    tabs.forEach((tab) => {
      CreateContextMenuItem(
        "BA:" + tab.sessionId,
        tab.title,
        tab.favIconUrl,
        ["browser_action"]
      );
    });
  }
  // If there are too much items, place "maximum - 1" items to the top level
  // and place the rest of them into a submenu.
  else {
    tabs.splice(0, max_allowed - 1).forEach((tab) => {
      CreateContextMenuItem(
        "BA:" + tab.sessionId,
        tab.title,
        tab.favIconUrl,
        ["browser_action"]
      );
    });

    let moreMenu = CreateContextMenuItem(
      "MoreClosedTabs",
      browser.i18n.getMessage("more_entries_menu"),
      false,
      ["browser_action"]
    );

    tabs.forEach((tab) => {
      CreateContextMenuItem(
        "BA:" + tab.sessionId,
        tab.title,
        tab.favIconUrl,
        ["browser_action"],
        moreMenu
      );
    });
  }
}

// Fired if one of our context menu entries is clicked.
// Restores the tab, referenced by this context menu entry.
function ContextMenuClicked(aInfo) {
  let sessionid = aInfo.menuItemId.substring(aInfo.menuItemId.indexOf(":") + 1);
  browser.sessions.restore(sessionid);
}


// Check for "icons" support in context menus by adding a temporary entry.
// In Firefox 55, this will lead to an error:
// TypeError: item is undefined  ext-contextMenus.js:127:1
var MENU_ICONS_SUPPORTED = false;
try {
  browser.contextMenus.create({title: "test", icons: {18: "icons/undoCloseTab.png"}});
  MENU_ICONS_SUPPORTED = true;
} catch(e) {}

// Register event listeners
browser.browserAction.onClicked.addListener(ToolbarButtonClicked);

browser.sessions.onChanged.addListener(ClosedTabListChanged);
browser.windows.onFocusChanged.addListener(ClosedTabListChanged);
ClosedTabListChanged();

browser.contextMenus.onClicked.addListener(ContextMenuClicked);
