/*
    Firefox addon "Undo Close Tab"
    Copyright (C) 2018  Manuel Reimer <manuel.reimer@gmx.de>
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

// Fired whenever colors in browser change
function ThemeUpdated(updateInfo) {
  const size = 32;
  // Theme colors have changed
  if (updateInfo.theme.colors) {
    // Get new color
    const colors = updateInfo.theme.colors;
    const color = (colors.icons == null) ? colors.toolbar_text : colors.icons;

    // Get SVG image
    const xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL("icons/undoclosetab.svg"), false);
    xhr.send();
    let svg = xhr.responseText;

    // Replace color in SVG and convert result to data-URL
    svg = svg.replace(/#0c0c0d/g, color);
    svg = svg.replace(/opacity:0.8/g, "opacity:1.0");
    const svgdataurl = "data:image/svg+xml;base64," + btoa(svg);

    // Create canvas to render to
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    // Render SVG to canvas and set resulting ImageData to our browserAction
    const img = new Image(size, size);
    img.onload = function() {
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = {imageData: {}, windowId: updateInfo.windowId};
      data.imageData[size] = imageData
      browser.browserAction.setIcon(data);
    }
    img.src = svgdataurl;
  }
  // Theme has been reset/disabled
  else {
    browser.browserAction.setIcon({imageData: null});
  }
}

// Register to "onUpdated" event, so we know when theme colors change.
browser.theme.onUpdated.addListener(ThemeUpdated);

// Initial loading would actually be much more complicated as every window
// could have its own theme. For now we just assume there is a global theme.
browser.theme.getCurrent().then((themeInfo) => {
  ThemeUpdated({theme: themeInfo, windowId: null});
});
