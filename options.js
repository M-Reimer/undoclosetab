const numberText = document.querySelector("#number_inputbox");
const checkPage = document.querySelector("#menu_page_checkbox");
const checkTab = document.querySelector("#menu_tab_checkbox");

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
      showPageMenu: checkPage.checked
    });
    break;
  }
  browser.extension.getBackgroundPage().ClosedTabListChanged();
}

function init() {
  document.querySelector("#general_headline").textContent = browser.i18n.getMessage("general_headline_label");
  document.querySelector("#number_label").textContent = browser.i18n.getMessage("menuitem_number_label");
  document.querySelector("#menus_headline").textContent = browser.i18n.getMessage("menus_headline_label");
  document.querySelector("#menu_tab_label").textContent = browser.i18n.getMessage("menu_tab_label");
  document.querySelector("#menu_page_label").textContent = browser.i18n.getMessage("menu_page_label");
  numberText.title = browser.i18n.getMessage("numberText_title", browser.sessions.MAX_SESSION_RESULTS);

  numberText.max = browser.sessions.MAX_SESSION_RESULTS;
  loadOptions();
  numberText.addEventListener("change", numberChanged);
  checkTab.addEventListener("change", checkboxChanged);
  checkPage.addEventListener("change", checkboxChanged);
}

function loadOptions() {
  browser.storage.local.get().then((result) => {
    numberText.value = result.showNumber || browser.sessions.MAX_SESSION_RESULTS;
    checkTab.checked = result.showTabMenu || false;
    checkPage.checked = result.showPageMenu || false;
  });
}

init();
