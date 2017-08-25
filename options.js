const numberText = document.querySelector("#number_inputbox");

async function numberChanged(e) {
  var showNumber = parseInt(numberText.value);
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

function init() {
  document.querySelector("#general_headline").textContent = browser.i18n.getMessage("general_headline_label");
  document.querySelector("#number_label").textContent = browser.i18n.getMessage("menuitem_number_label");
  numberText.title = browser.i18n.getMessage("numberText_title", browser.sessions.MAX_SESSION_RESULTS);
  numberText.max = browser.sessions.MAX_SESSION_RESULTS;
  loadOptions();
  numberText.addEventListener("change", numberChanged);
}

function loadOptions() {
  browser.storage.local.get("showNumber").then((result) => {
    numberText.value = result.showNumber || browser.sessions.MAX_SESSION_RESULTS;
  });
}

init();
