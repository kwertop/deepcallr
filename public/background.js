chrome.action.onClicked.addListener((function(tab) {
  // const { streamId, opts } = await new Promise((resolve) => {
  //   chrome.desktopCapture.chooseDesktopMedia(
  //     ['tab', 'audio'],
  //     tab,
  //     async (streamId, options) => {
  //       resolve({ streamId, options });
  //     }
  //   );
  // }).catch((err) => console.error(err));

  if(tab.url.includes("zoom.us")) {
    chrome.desktopCapture.chooseDesktopMedia(
      ['tab', 'audio'],
      tab,
      (streamId, options) => {
        console.log(streamId, options);
      }
    );
  }

  chrome.tabs.sendMessage(tab.id, {
    action: "loadTray"
  });
}));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(message.action === "openPopup") {
    chrome.action.setPopup({
      popup: message.popup,
      tabId: sender.tab.id
    })
  }
  else if(message.action === "loggedIn" && sender && sender.tab) {
    chrome.tabs.get(sender.tab.id, (tab) => {
      chrome.tabs.highlight({
        tabs: tab.index,
        windowId: tab.windowId
      });
    });
  }
  else if(message.action === "startCapture") {
    useChromeTabCapture(message.lang);
  }
  else if(message.action === "getURLLocation") {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      var tab = tabs[0];
      var url = tab.url;
      sendResponse({ location: url });
    });
    return true;
  }
  else if(message.action === "getAccessToken") {
    chrome.cookies.get({
      name: 'buckbeak-access-token',
      url: 'http://localhost:3000/'
    }, (cookies) => {
      let buckBeakAccessToken = null;
      if(cookies) {
        buckBeakAccessToken = decodeURIComponent(cookies.value);
      }
      sendResponse({ token: buckBeakAccessToken });
    });
    return true;
  }
  else if(message.action === 'openSignUpPage') {
    chrome.tabs.create({ url: 'http://localhost:3000/signup' });
  }
  else if(message.action === 'openLoginPage') {
    chrome.tabs.create({ url: 'http://localhost:3000/login' });
  }
  if(message.action === "closePopup") {
    var windows = chrome.extension.getViews({type: "popup"});
    if (windows.length) {
      windows[0].close(); // Normally, there shouldn't be more than 1 popup 
    } else {
      console.log("There was no popup to close");
    }
  }
});