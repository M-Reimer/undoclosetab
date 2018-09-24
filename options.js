const numberText = document.querySelector("#number_inputbox");
const checkPage = document.querySelector("#menu_page_checkbox");
const checkPageMenuitem = document.querySelector("#menuitem_page_checkbox");
const checkTab = document.querySelector("#menu_tab_checkbox");
const checkOnlyCurrent = document.querySelector("#onlycurrent_checkbox");

async function numberChanged(e) {
  let showNumber = parseInt(numberText.value);
  if (isNaN(showNumber) ||
      showNumber > numberText.max ||
      showNumber < numberText.min)
    showNumber = browser.sessions.MAX_SESSION_RESULTS;

  await browser.storage.local.set({
    showNumber: showNumber
  });

  numberText.value = showNumber;
  browser.extension.getBackgroundPage().ClosedTabListChanged();
}

async function checkboxChanged(e) {
  switch (e.target.id) {
  case "menu_tab_checkbox":
    await browser.storage.local.set({
      showTabMenu: checkTab.checked
    });
    break;
  case "menu_page_checkbox":
    await browser.storage.local.set({
      showPageMenu: checkPage.checked,
      showPageMenuitem: false
    });
    checkPageMenuitem.checked = false;
    break;
  case "menuitem_page_checkbox":
    await browser.storage.local.set({
      showPageMenu: false,
      showPageMenuitem: checkPageMenuitem.checked
    });
    checkPage.checked = false;
    break;
  case "onlycurrent_checkbox":
    await browser.storage.local.set({
      onlyCurrent: checkOnlyCurrent.checked
    });
    break;
  }
  browser.extension.getBackgroundPage().ClosedTabListChanged();
}

function init() {
  [
    "contextmenus_headline",
    "menuitem_number_label",
    "onlycurrent_label",
    "menus_headline",
    "menu_tab_label",
    "menu_page_label",
    "menuitem_page_label"
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
}

function loadOptions() {
  browser.storage.local.get().then((result) => {
    numberText.value = result.showNumber || browser.sessions.MAX_SESSION_RESULTS;
    checkTab.checked = result.showTabMenu || false;
    checkPage.checked = result.showPageMenu || false;
    checkPageMenuitem.checked = result.showPageMenuitem || false;
    checkOnlyCurrent.checked = (result.onlyCurrent !== undefined) ? result.onlyCurrent : true;
  });
}

init();
