function restoreMostRecent(sessionInfos) {
  for (var index = 0; index < sessionInfos.length; index++) {
    if (sessionInfos[index].tab) {
      browser.sessions.restore(sessionInfos[index].tab.sessionId);
      return;
    }
  }
}

function onError(error) {
  console.log(error);
}

browser.browserAction.onClicked.addListener(function() {
  var gettingSessions = browser.sessions.getRecentlyClosed({
    maxResults: 10
  });
  gettingSessions.then(restoreMostRecent, onError);
});
