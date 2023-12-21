/*
    Firefox addon "Undo Close Tab"
    Copyright (C) 2023  Manuel Reimer <manuel.reimer@gmx.de>

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
"use strict";

// Abstraction layer for the handling of closed tabs. Handles bug workarounds
// and Android support.
const TabHandling = {
  // Returns a list of last closed tabs.
  // Parameters:
  //   aMaxResults: Maximum amount of results to return (false means "all")
  //   aOnlyCurrent: If "true" only returns tabs from the current window
  // Return value: List of tab objects
  GetLastClosedTabs: async function(aMaxResults, aOnlyCurrent) {
    // Get the session API tabs first (these should be the most current tabs)
    let tabs = await this._SessionsGetLastClosedTabs();

    // If requested and possible (windows API is available), then limit list
    // to tabs from the current window
    if (aOnlyCurrent && browser.windows !== undefined) {
      const currentWindow = await browser.windows.getCurrent();
      tabs = tabs.filter((tab) => { return tab.windowId === undefined || tab.windowId === currentWindow.id});
    }

    // HACK! See https://github.com/M-Reimer/undoclosetab/issues/117#issuecomment-1527397147
    tabs = tabs.filter((tab) => { return tab.title !== undefined });

    // If requested, limit the return list to the given amount of entries
    if (aMaxResults && tabs.length > aMaxResults)
      tabs = tabs.splice(0, aMaxResults);

    // Finally return the tab list
    return tabs;
  },

  // Private method which gets a recently closed tabs list from "sessions" API
  _SessionsGetLastClosedTabs: async function () {
    // Filter the saved closed items to only contain tabs
    const sessions = await browser.sessions.getRecentlyClosed();
    const tabs = sessions.filter(s => s.tab);

    // Now remove the additional "tab" object, we have to walk through,
    // (don't need that) after backing up the session lastModified.
    tabs.forEach((o, i, a) => {
      a[i].tab._tabCloseTime = a[i].lastModified;
      a[i] = a[i].tab
    });

    // Finally return the tab list
    return tabs;
  },

  // This function clears the list of recently closed items
  ClearList: async function(aOnlyCurrent) {
    // Prefilter the tab list and remove the resulting tabs
    let tabs = await this._SessionsGetLastClosedTabs();
    if (aOnlyCurrent) {
      const currentWindow = await browser.windows.getCurrent();
      tabs = tabs.filter(t => t.windowId === currentWindow.id);
    }
    const promises = [];
    tabs.forEach((tab) => {
      promises.push(browser.sessions.forgetClosedTab(tab.windowId, tab.sessionId));
    });
    await Promise.all(promises);
  },

  Restore: async function(aSessionId) {
    const session = await browser.sessions.restore(aSessionId);

    const currentWindow = await browser.windows.getCurrent();
    if (session.tab.windowId != currentWindow.id)
      browser.windows.update(session.tab.windowId, {focused: true});
  },

  Init: function() {
    // Currently unused
  }
}
