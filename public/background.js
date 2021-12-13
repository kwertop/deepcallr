chrome.action.onClicked.addListener((function(tab) {
  chrome.tabs.sendMessage(tab.id, {
    action: "loadTray"
  })
}));

chrome.runtime.onMessage.addListener((message, sender, response) => {
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
});