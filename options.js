"use strict";

const numberShowNumber = document.getElementById("showNumber_inputbox");
const checkPage = document.getElementById("showPageMenu_checkbox");
const checkPageMenuitem = document.getElementById("showPageMenuitem_checkbox");
const checkTab = document.getElementById("showTabMenu_checkbox");
const checkOnlyCurrent = document.getElementById("onlyCurrent_checkbox");
const checkClearList = document.getElementById("showClearList_checkbox");
const checkRestoreGroup = document.getElementById("restoreGroup_checkbox");
const numberGroupTime = document.getElementById("groupTime_inputbox");

async function numberChanged(e) {
  if (!e.target.id.match(/([a-zA-Z_]+)_inputbox/))
    return;
  const pref = RegExp.$1;

  let showNumber = parseInt(e.target.value);
  if (isNaN(showNumber) ||
      showNumber > e.target.max ||
      showNumber < e.target.min)
    showNumber = e.target.getAttribute("value");

  const params = {};
  params[pref] = showNumber;
  await Storage.set(params);

  e.target.value = showNumber;
}

async function checkboxChanged(e) {
  if (!e.target.id.match(/([a-zA-Z_]+)_checkbox/))
    return;

  const pref = RegExp.$1;
  const params = {};
  params[pref] = e.target.checked;

  switch (e.target.id) {
  case checkPage.id:
    params["showPageMenuitem"] = false;
    checkPageMenuitem.checked = false;
    break;
  case checkPageMenuitem.id:
    params["showPageMenu"] = false;
    checkPage.checked = false;
    break;
  case checkRestoreGroup.id:
    numberGroupTime.disabled = !e.target.checked;
    break;
  }

  await Storage.set(params);
}

function init() {
  // Android handling. For now just hide the whole configuration UI.
  if (browser.menus === undefined ||
      browser.windows === undefined ||
      browser.sessions === undefined) {
    document.body.style.display = "none";
    return;
  }

  [
    "general_headline",
    "restoreGroup_label",
    "contextmenus_headline",
    "menuitem_number_label",
    "onlycurrent_label",
    "menus_headline",
    "menu_tab_label",
    "menu_page_label",
    "menuitem_page_label",
    "menuitem_clearlist_label"
  ].forEach((id) => {
    document.querySelector("#" + id).textContent = browser.i18n.getMessage(id);
  });
  numberShowNumber.title = browser.i18n.getMessage("numberText_title", browser.sessions.MAX_SESSION_RESULTS);

  numberShowNumber.max = browser.sessions.MAX_SESSION_RESULTS;
  numberShowNumber.setAttribute("value", numberShowNumber.max);
  loadOptions();

  numberShowNumber.addEventListener("change", numberChanged);
  numberGroupTime.addEventListener("change", numberChanged);

  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", checkboxChanged);
  });
}

function loadOptions() {
  Storage.get().then((result) => {
    numberShowNumber.value = result.showNumber;
    checkTab.checked = result.showTabMenu;
    checkPage.checked = result.showPageMenu;
    checkPageMenuitem.checked = result.showPageMenuitem;
    checkOnlyCurrent.checked = result.onlyCurrent;
    checkClearList.checked = result.showClearList;
    checkRestoreGroup.checked = result.restoreGroup;
    numberGroupTime.value = result.groupTime;
    numberGroupTime.disabled = !result.restoreGroup;
  });
}

init();
