chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("control came here");
    if (request.message == "exportcc") {
      // exportConversation(request.conversations);
    }
    return true;
  }
);

function exportConversation(strConversations) {
  console.log("control then came here");
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, function(tabs) {
    var tab = tabs[0];
    var windowURL = tab.url;
    strConversations.join('\n');
    var blob = new Blob([strConversations], {type: "text/plain"});
    var intermediateURL = new URL(windowURL);
    var fileUrl = intermediateURL.createObjectURL(blob);
    chrome.downloads.download({
      url: fileUrl, // "https://d5d8d9fr8izry.cloudfront.net/baazi_icons/en/game_17.png", // The object URL can be used as download URL
      filename: "transribed.txt",
      saveAs: true
    }, downloadCallback);
    console.log("window url: " + url);
  });
  // strConversations.join('\n');
  // var blob = new Blob([strConversations], {type: "text/plain"});
  // // var urlBuilder = window.webkitURL || window.URL || window.mozURL || window.msURL;
  // console.log("URL: " + URL);
  // var url = URL.createObjectURL(blob);
  // // var url = 'data:attachment/text,' + encodeURI(strConversations);
  // chrome.downloads.download({
  //   url: url, // "https://d5d8d9fr8izry.cloudfront.net/baazi_icons/en/game_17.png", // The object URL can be used as download URL
  //   filename: "transribed.txt",
  //   saveAs: true
  // }, downloadCallback);
}

function downloadCallback(downloadId) {
  console.log("downloadId: " + downloadId);
  console.log("error download: " + chrome.runtime.lastError);
}