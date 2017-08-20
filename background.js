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
async function GetLastClosedTabs() {
  try {
    const currentWindow = await browser.windows.getCurrent();
    const sessions = await browser.sessions.getRecentlyClosed();
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

// Fired if the list of closed tabs has changed.
// Updates the context menu entries with the list of last closed tabs.
async function ClosedTabListChanged() {
  await browser.contextMenus.removeAll();
  const tabs = await GetLastClosedTabs();
  tabs.splice(0, 5).forEach((tab) => { // top-level menu cannot exceed 6 items.
    browser.contextMenus.create({
      id: tab.sessionId,
      title: tab.title,
      contexts: ["browser_action"]
    });
  });
  let moreMenu = browser.contextMenus.create({
    id: "MoreClosedTabs",
    title: browser.i18n.getMessage("more_entries_menu"),
    contexts: ["browser_action"]
  });
  tabs.forEach((tab) => {
    browser.contextMenus.create({
      id: tab.sessionId,
      title: tab.title,
      parentId: moreMenu,
      contexts: ["browser_action"]
    });
  });
}

// Fired if one of our context menu entries is clicked.
// Restores the tab, referenced by this context menu entry.
function ContextMenuClicked(aInfo) {
  browser.sessions.restore(aInfo.menuItemId);
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
