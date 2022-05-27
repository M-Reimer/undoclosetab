/*
    WebExtension utils for use in my Firefox Add-ons
    Copyright (C) 2021  Manuel Reimer <manuel.reimer@gmx.de>

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

'use strict';

// Central place for storage handling and preference defaults
const Storage = {
  _defaults: false,

  get: async function() {
    if (!this._defaults) {
      const url = browser.runtime.getURL('/default-preferences.json');
      const txt = await (await fetch(url)).text();
      // VERY basic comment support! Only "//" and only at the start of lines!
      let json = txt.replace(/^\s*\/\/.*$/mg, "");
      // Allow localized strings
      json = json.replace(/__MSG_([A-Za-z0-9_]+?)__/g, (match, msgName) => {
        return browser.i18n.getMessage(msgName);
      });
      this._defaults = JSON.parse(json);
    }

    const prefs = await browser.storage.local.get();
    for (let name in this._defaults) {
      if (prefs[name] === undefined)
        prefs[name] = this._defaults[name];
    }
    return prefs;
  },

  set: function(aObject) {
    return browser.storage.local.set(aObject);
  },

  remove: function(keys) {
    return browser.storage.local.remove(keys);
  }
};
