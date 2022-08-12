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
      const defaults = JSON.parse(json);
      await this._apply_managed_defaults(defaults);
      this._defaults = defaults;
    }

    const prefs = await browser.storage.local.get();
    for (let name in this._defaults) {
      if (prefs[name] === undefined)
        prefs[name] = this._defaults[name];
    }
    return prefs;
  },

  _gettype: function(object) {
    return Object.prototype.toString.call(object);
  },

  set: function(aObject) {
    return browser.storage.local.set(aObject);
  },

  remove: function(keys) {
    return browser.storage.local.remove(keys);
  },


  // IMPORTANT!!!
  // If you found this, then you hopefully know what you are doing!
  // Mozilla decided against verification of managed preferences:
  // https://bugzil.la/1230802#c30
  // The following code does *very basic* verification on *very low* level,
  // but you can still create unsupported cases very easily, which could make my
  // Add-ons break. I have no regard for managed preferences! The way how I
  // handle my preferences could change with any Add-on release, and it is
  // *your job* to keep track of this if you decide to use managed preferences!
  _apply_managed_defaults: async function(defaults) {
    let mgdefaults = {};
    // Do not allow storage.managed to make Add-ons unusable.
    // Catch all errors that may occur. Then log and ignore them.
    try {
      mgdefaults = await browser.storage.managed.get();
    }
    catch(e) {
      // HACK: https://bugzil.la/1784446
      //       Only log message if it's not caused by above bug.
      if (e.message != "Managed storage manifest not found")
        console.log(e);
      return;
    }

    // Run over all managed preference values that target an existing default
    for (const [name, mgvalue] of Object.entries(mgdefaults)) {
      if (!Object.hasOwn(defaults, name))
        continue;
      const ourvalue = defaults[name];

      // Do not allow managed preferences to change a type of a preference
      const mgtype = Object.prototype.toString.call(mgvalue);
      const ourtype = Object.prototype.toString.call(ourvalue);
      if (mgtype !== ourtype) {
        console.log(`Managed default applying failed for "${name}" which is of type ${mgtype} but should be of type ${ourtype}`);
        continue;
      }

      // Do not allow managed preferences to empty arrays
      if (Array.isArray(mgvalue) && mgvalue.length == 0) {
        console.log(`Managed default applying failed for "${name}" because managed preferences are not allowed to empty arrays`);
        continue;
      }

      // Force managed array values to be of same type as our defaults
      if (Array.isArray(ourvalue) && ourvalue.length > 0) {
        const itemtype = Object.prototype.toString.call(ourvalue[0]);
        const mgtypes = mgvalue.map(x => Object.prototype.toString.call(x));
        const invalid = mgtypes.filter(x => x !== itemtype);
        if (invalid.length) {
          console.log(`Managed default applying failed for "${name}" because one of its items is of type ${invalid[0]} but should be of type ${itemtype}`);
          continue;
        }
      }

      // If we reach here, then we apply the managed default value
      defaults[name] = mgvalue;
    }
  }
};
