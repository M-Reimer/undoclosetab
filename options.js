const numberText = document.querySelector("#number_inputbox");

function numberChanged(e) {
  var showNumber = parseInt(numberText.value);
  if (isNaN(showNumber) ||
      showNumber > numberText.max ||
      showNumber < numberText.min)
    showNumber = 6;

  browser.storage.local.set({
    showNumber: showNumber
  });

  numberText.value = showNumber;
}

function init() {
  document.querySelector("#number_label").textContent = browser.i18n.getMessage("menuitem_number_label");
  numberText.title = browser.i18n.getMessage("numberText_title");
  numberText.max = browser.sessions.MAX_SESSION_RESULTS;
  loadOptions();
  numberText.addEventListener("change", numberChanged);
}

function loadOptions() {
  browser.storage.local.get("showNumber").then((result) => {
    numberText.value = result.showNumber || 6;
  },
  (error) => {
    console.log(error);
  });
}

init();
