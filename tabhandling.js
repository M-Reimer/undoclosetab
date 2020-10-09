/*
    Firefox addon "Undo Close Tab"
    Copyright (C) 2020  Manuel Reimer <manuel.reimer@gmx.de>

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
  // Properties for our "internal list"
  INT_SESSION_PREFIX: "UCTINT",
  _internallist: [],

  // Returns a list of last closed tabs.
  // Parameters:
  //   aMaxResults: Maximum amount of results to return (false means "all")
  //   aOnlyCurrent: If "true" only returns tabs from the current window
  // Return value: List of tab objects
  GetLastClosedTabs: async function(aMaxResults, aOnlyCurrent) {
    // Get the session API tabs first (these should be the most current tabs)
    const stabs = await this._SessionsGetLastClosedTabs();

    // Then add the internal list to the end of the session tabs list
    let tabs = stabs.concat(this._internallist);

    // If requested and possible (windows API is available), then limit list
    // to tabs from the current window
    if (aOnlyCurrent && browser.windows !== undefined) {
      const currentWindow = await browser.windows.getCurrent();
      tabs = tabs.filter((tab) => { return tab.windowId === undefined || tab.windowId === currentWindow.id});
    }

    // If requested, limit the return list to the given amount of entries
    if (aMaxResults && tabs.length > aMaxResults)
      tabs = tabs.splice(0, aMaxResults);

    // Finally return the tab list
    return tabs;
  },

  // Private method which gets a recently closed tabs list from "sessions" API
  _SessionsGetLastClosedTabs: async function () {
    // Return empty list if there is no "sessions" API (Android)
    if (browser.sessions === undefined)
      return [];

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
    // Reset internal tab list
    this._internallist = [];

    // Stop clearing here if we are on Android
    if (browser.sessions === undefined ||
        browser.windows === undefined)
      return;

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
    // This tab is stored in our internal list. These tabs have no window
    // associated with them, so just create a new tab in the current window.
    if (aSessionId.startsWith(this.INT_SESSION_PREFIX)) {
      const index = this._internallist.findIndex((tab) => {
        return tab.sessionId === aSessionId;
      });

      if (index === -1)
        return;

      const [tab] = this._internallist.splice(index, 1);
      await browser.tabs.create({url: tab.url});
    }
    // This tab is stored in the browser session manager. So ask the session
    // manager for a restore and focus the window where we restored.
    else {
      const session = await browser.sessions.restore(aSessionId);

      const currentWindow = await browser.windows.getCurrent();
      if (session.tab.windowId != currentWindow.id)
        browser.windows.update(session.tab.windowId, {focused: true});
    }
  },

  // The following two event handlers are used on Android. They fill our
  // internal list. There is no "sessions" API on Android. We only add the
  // properties that are needed for "Restore last tab" as there is no context
  // menu on Android either.
  _onTabUpdated: function(aTabId, aChangeInfo) {
    if (aChangeInfo.url !== undefined)
      this._tabcache[aTabId] = aChangeInfo.url;
  },
  _onTabClosed: function(aTabId) {
    if (aTabId in this._tabcache) {
      this._internallist.unshift({
        url: this._tabcache[aTabId],
        sessionId: this.INT_SESSION_PREFIX + String(++this._sessioncounter)
      });
      delete this._tabcache[aTabId];
    }
    while (this._internallist.length > 25)
      this._internallist.pop();
  },

  // Workaround of https://bugzil.la/1538119
  // If we don't get rid of *all* entries of the "sessions" history on browser
  // start, then we'll end up with duplicated sessionId's which causes random
  // stuff to be restored.
  _Bug1538119Workaround: async function() {
    // Get the current list of last closed tabs
    const lastsession = await this._SessionsGetLastClosedTabs();

    // Place them all to our internal list
    lastsession.forEach((tab) => {
      if (tab.url.startsWith("http"))
        this._internallist.push({
          sessionId: this.INT_SESSION_PREFIX + String(this._internallist.length + 1),
          title: tab.title,
          favIconUrl: tab.favIconUrl,
          url: tab.url
        });
    });

    // Now purge the whole session history (tabs **and** windows to really
    // reset the internal session counter to zero).
    const sessions = await browser.sessions.getRecentlyClosed();
    sessions.forEach((s) => {
      if (s.tab)
        browser.sessions.forgetClosedTab(s.tab.windowId, s.tab.sessionId);
      else
        browser.sessions.forgetClosedWindow(s.window.sessionId);
    });
  },

  Init: function() {
    // Setup for browsers with "sessions" API
    if (browser.sessions !== undefined) {
      browser.runtime.onStartup.addListener(this._Bug1538119Workaround.bind(this));
    }

    // Setup for Android. If there is no "sessions" API, then set up our own
    // "closed tabs" recording.
    if (browser.sessions === undefined) {
      this._tabcache = {};
      this._sessioncounter = 0;
      browser.tabs.onRemoved.addListener(this._onTabClosed.bind(this));
      browser.tabs.onUpdated.addListener(this._onTabUpdated.bind(this));
    }
  }
}
