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
"use strict";

// Very simple utility to allow translated text contents in option pages
(function HTMLi18n() {
  const items = document.querySelectorAll('*[data-i18n-id]');
  for (const item of items) {
    const i18n_id = item.getAttribute("data-i18n-id");
    item.textContent = browser.i18n.getMessage(i18n_id);
  }
})();
