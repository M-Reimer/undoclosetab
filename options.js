"use strict";

const numberText = document.querySelector("#number_inputbox");
const checkPage = document.querySelector("#showPageMenu_checkbox");
const checkPageMenuitem = document.querySelector("#showPageMenuitem_checkbox");
const checkTab = document.querySelector("#showTabMenu_checkbox");
const checkOnlyCurrent = document.querySelector("#onlyCurrent_checkbox");
const checkClearList = document.getElementById("showClearList_checkbox");

async function numberChanged(e) {
  let showNumber = parseInt(numberText.value);
  if (isNaN(showNumber) ||
      showNumber > numberText.max ||
      showNumber < numberText.min)
    showNumber = browser.sessions.MAX_SESSION_RESULTS;

  await Storage.set({
    showNumber: showNumber
  });

  numberText.value = showNumber;
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
  numberText.title = browser.i18n.getMessage("numberText_title", browser.sessions.MAX_SESSION_RESULTS);

  numberText.max = browser.sessions.MAX_SESSION_RESULTS;
  loadOptions();
  numberText.addEventListener("change", numberChanged);
  checkTab.addEventListener("change", checkboxChanged);
  checkPage.addEventListener("change", checkboxChanged);
  checkPageMenuitem.addEventListener("change", checkboxChanged);
  checkOnlyCurrent.addEventListener("change", checkboxChanged);
  checkClearList.addEventListener("change", checkboxChanged);
}

function loadOptions() {
  Storage.get().then((result) => {
    numberText.value = result.showNumber;
    checkTab.checked = result.showTabMenu;
    checkPage.checked = result.showPageMenu;
    checkPageMenuitem.checked = result.showPageMenuitem;
    checkOnlyCurrent.checked = result.onlyCurrent;
    checkClearList.checked = result.showClearList;
  });
}

init();
