window.addEventListener('DOMContentLoaded', (event) => {
  const loginContainer = document.getElementById("popup-login-container");
  const recorderDiv = document.getElementById("recorder-div");
  const appNamesRow = document.getElementById("app-names-row");
  loginContainer.style.display = "none";
  const isLoggedIn = true;

  recorderDiv.addEventListener("click", () => {
    // chrome.runtime.sendMessage({
    //   action: 'closePopup',
    //   popup: ''
    // });
    var windows = chrome.extension.getViews({type: "popup"});
    if (windows.length) {
      windows[0].close(); // Normally, there shouldn't be more than 1 popup 
    } else {
      console.log("There was no popup to close");
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let activeTabId = tabs[0].id;
      chrome.tabs.sendMessage(activeTabId, {
        action: "loadTray"
      })
    });
  });
  chrome.runtime.sendMessage({
    action: 'getURLLocation'
  }, (response) => {
    const originUrl = response.location;
    const isMeetingUrlLocation = isMeetingAppRunning(originUrl);
    // console.log("isMeetingUrlLocation: " + isMeetingUrlLocation);
    // console.error("originUrl ", originUrl);
    if(isLoggedIn) {
      if(isMeetingUrlLocation) {
        recorderDiv.style.display = "block";
        appNamesRow.style.display = "none";
      }
      else {
        recorderDiv.style.display = "none";
        appNamesRow.style.display = "block";
      }
      loginContainer.style.display = "none";
    }
    else {
      recorderDiv.style.display = "none";
      loginContainer.style.display = "block";
    }

    // chrome.tabs.query({
    //   active: true,
    //   currentWindow: true
    // }, (tabs) => {
    //   var tab = tabs[0];
    //   chrome.tabCapture.getMediaStreamId((streamId) => {
    //     chrome.tabs.sendMessage(tab.id, { action: 'streamId', streamId: streamId });
    //   });
    // });
    // chrome.runtime.sendMessage({
    //   action: 'streamId',
    //   streamId: streamId
    // });

    // chrome.tabCapture.capture({audio: true, video: false}, (stream) => {
    //   chrome.tabs.query({
    //     active: true,
    //     currentWindow: true
    //   }, (tabs) => {
    //     var tab = tabs[0];
    //     chrome.tabs.sendMessage(tab.id, { action: 'stream', stream: stream });
    //   });
    // });
  });
});

function isMeetingAppRunning(origin) {
  return origin.includes("meet.google.com") ||
    origin.includes("teams.microsoft.com") ||
    origin.includes("zoom.us") ||
    origin.includes("webex.com");
}