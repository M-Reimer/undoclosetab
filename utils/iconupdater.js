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

const IconUpdater = {
  // Fired whenever colors in browser change
  ThemeUpdated: async function ThemeUpdated(updateInfo) {
    const size = 32;

    // Theme has been reset/disabled
    if (!updateInfo.theme.colors) {
      browser.browserAction.setIcon({imageData: null});
      return;
    }

    // Get new color
    const colors = updateInfo.theme.colors;
    const color = colors.icons ||
                  colors.toolbar_text ||
                  colors.bookmark_text ||
                  colors.textcolor ||
                  colors.tab_background_text;

    // Theme without usable color value
    if (!color) {
      browser.browserAction.setIcon({imageData: null});
      return;
    }

    // Get SVG image
    let svg = await (await fetch(browser.runtime.getURL(this.default_image))).text()

    // Replace color in SVG and convert result to data-URL
    svg = svg.replace(/#0c0c0d/g, color);
    svg = svg.replace(/opacity:0.8/g, "opacity:1.0");
    const svgdataurl = "data:image/svg+xml;base64," + btoa(svg);

    // Create canvas to render to
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Render SVG to canvas and set resulting ImageData to our browserAction
    const img = new Image(size, size);
    img.onload = async function() {
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = {imageData: {}};
      data.imageData[size] = imageData;
      // details.windowId came with Firefox 62
      // Adding it for older versions triggers an exception
      const info = await browser.runtime.getBrowserInfo();
      if (parseInt(info.version) >= 62)
        data.windowId = updateInfo.windowId;
      await browser.browserAction.setIcon(data);
    }
    img.src = svgdataurl;
  },

  Init: async function(aDefaultImage) {
    if (browser.browserAction.setIcon === undefined) // If on Android
      return;

    this.default_image = aDefaultImage;

    // Register to "onUpdated" event, so we know when theme colors change.
    browser.theme.onUpdated.addListener(this.ThemeUpdated.bind(this));

    // Initial loading: Every window could have its own theme
    const windows = await browser.windows.getAll();
    for (const window of windows) {
      const themeInfo = await browser.theme.getCurrent(window.id);
      this.ThemeUpdated({theme: themeInfo, windowId: window.id});
    }
  }
};
