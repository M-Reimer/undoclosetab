const numberText = document.querySelector("#number_inputbox");
const numberRange = document.querySelector("#number_rangebox");
const saveButton = document.querySelector("#save_button");

function numberChanged(e) {
  if (e.target.id == 'number_inputbox') {
    numberRange.value = e.target.value;
  }
  else if (e.target.id == 'number_rangebox') {
    numberText.value = e.target.value;
  }
  else {
    console.error(`Unknown changes in id:${e.target.id}`);
  }
}

function init() {
  document.querySelector("#number_label").textContent = browser.i18n.getMessage("menuitem_number_label");

  numberText.title = browser.i18n.getMessage("numberText_title");
  numberRange.max = browser.sessions.MAX_SESSION_RESULTS;
  loadOptions();
  numberText.addEventListener("change", numberChanged);
  numberRange.addEventListener("change", numberChanged);
  saveButton.innerText = browser.i18n.getMessage("saveButton_label");

  document.querySelector("form").addEventListener("submit", saveOptions);
}

function showOnSaveButton(message, cleanDelay = 0) {
  const defaultLabel = browser.i18n.getMessage("saveButton_label");
  saveButton.innerText = message;
  if (cleanDelay > 0)
    setTimeout(() => { showOnSaveButton(defaultLabel); }, cleanDelay);
}

function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    showNumber: numberText.value
  }).then(() => {
    const message = browser.i18n.getMessage("saveButton_saved_label");
    showOnSaveButton(message, 1500);
  }, error => {
    const message = browser.i18n.getMessage("saveButton_error_label");
    showOnSaveButton(message, 2000);
    console.error(error);
  }
  );
}

function loadOptions() {
  function setCurrentOptions(result) {
    numberText.value = result.showNumber || 6;
    numberRange.value = result.showNumber || 6;
  }

  browser.storage.local.get("showNumber").then(setCurrentOptions, error => {
    console.log(error);
  });
}

init();