/*
    Firefox addon "Undo Close Tab"
    Copyright (C) 2017  Manuel Reimer <manuel.reimer@gmx.de>

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

// Function to do all this "Promise" stuff required by the webextensions API.
// Will finally call the supplied callback with a list of closed tabs.
function GetLastClosedTabs(aCallback) {
  browser.windows.getCurrent().then(
    function(CurrentWindow) {
      browser.sessions.getRecentlyClosed().then(
        function(Sessions) {
          var tablist = [];
          for (var index = 0; index < Sessions.length; index++) {
            var session = Sessions[index];
            if (session.tab &&
                session.tab.windowId == CurrentWindow.id)
              tablist.push(session.tab);
          }
          aCallback(tablist);
        }, onError
      );
    }, onError
  );
}

// Fired if the toolbar button is clicked.
// Restores the last closed tab in list.
function ToolbarButtonClicked() {
  GetLastClosedTabs(function(tablist) {
    if (tablist.length > 0)
      browser.sessions.restore(tablist[0].sessionId);
  });
}

// Fired if the list of closed tabs has changed.
// Updates the context menu entries with the list of last closed tabs.
function ClosedTabListChanged() {
  browser.contextMenus.removeAll();
  GetLastClosedTabs(function(tablist) {
    for (var index = 0; index < tablist.length; index++) {
      var tab = tablist[index];
      browser.contextMenus.create({
        id: tab.sessionId,
        title: tab.title,
        contexts: ["browser_action"]
      });
    }
  });
}

// Fired if one of our context menu entries is clicked.
// Restores the tab, referenced by this context menu entry.
function ContextMenuClicked(aInfo) {
  browser.sessions.restore(aInfo.menuItemId);
}

// Simple error handler. Just logs the error to console.
function onError(error) {
  console.log(error);
}


// Register event listeners
browser.browserAction.onClicked.addListener(ToolbarButtonClicked);

browser.sessions.onChanged.addListener(ClosedTabListChanged);
browser.windows.onFocusChanged.addListener(ClosedTabListChanged);
ClosedTabListChanged();

browser.contextMenus.onClicked.addListener(ContextMenuClicked);
