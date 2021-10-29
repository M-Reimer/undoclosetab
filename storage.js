/*
    Firefox addon "Save Screenshot"
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

'use strict';

// Central place for storage handling and preference defaults
const Storage = {
  _defaults: {
    "show_contextmenu": true,
    "savemethod": "open",
    "formats": ["png", "jpg", "copy"],
    "regions": ["full", "viewport", "selection"],
    "filenameformat": "",
    "jpegquality": 80,
    "savenotification": true,
    "image_comment": true,
    "copynotification": false
  },

  get: async function() {
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
