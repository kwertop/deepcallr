// $(document).ready(function () {
var meetcss = chrome.runtime.getURL("style.css");
$('<link rel="stylesheet" type="text/css" href="' + meetcss + '" >').appendTo("head");

var faAll = chrome.runtime.getURL("all.min.css");
$('<link rel="stylesheet" type="text/css" href="' + faAll + '" >').appendTo("head");

var faSolid = chrome.runtime.getURL("solid.min.css");
$('<link rel="stylesheet" type="text/css" href="' + faSolid + '" >').appendTo("head");

var bootstrapMinCss = chrome.runtime.getURL("bootstrap.min.css");
$('<link rel="stylesheet" type="text/css" href="' + bootstrapMinCss + '" >').appendTo("head");

var jqueryCss = chrome.runtime.getURL("jquery-ui.min.css");
$('<link rel="stylesheet" type="text/css" href="' + jqueryCss + '" >').appendTo("head");

var jqueryUiJs = chrome.runtime.getURL("jquery-ui.min.js");
$('<script type="text/javascript" href="' + jqueryUiJs + '" ></script>').appendTo("head");

var jqueryJs = chrome.runtime.getURL("jquery-3.6.0.min.js");
$('<script type="text/javascript" href="' + jqueryJs + '" ></script>').appendTo("head");

var myscriptJs = chrome.runtime.getURL("script.js");
$('<script type="text/javascript" href="' + myscriptJs + '" ></script>').appendTo("head");

var socketJs = chrome.runtime.getURL("socket.io.min.js");
$('<script type="text/javascript" href="' + socketJs + '" crossorigin="anonymous"></script>').appendTo("head");

function isMeetingAppRunning() {
  return location.host.includes("meet.google.com") ||
    location.host.includes("teams.microsoft.com") ||
    location.host.includes("zoom.us") ||
    location.host.includes("webex.com");
}

const loadTray = () => {
  const extensionOrigin = 'chrome-extension://' + chrome.runtime.id;
  if(!location.ancestorOrigins.contains(extensionOrigin)) {
    const callrContainer = document.getElementById("callr-tray");
    if(callrContainer) {
      callrContainer.remove();
    }
    else {
      fetch(chrome.runtime.getURL('/tray.html'))
        .then((response) => response.text())
        .then((data) => {
          document.body.insertAdjacentHTML(
            'beforeend',
            data
          );
          initHooks();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
}

const injectIframe = () => {
  var frame = document.createElement('iframe');
  frame.src = chrome.runtime.getURL('frame.html');
  frame.style.position = 'absolute';
  frame.style.left = '-5000px';
  document.body.appendChild(frame);
}

if (location.origin === "https://callr.ai") {
  if (location.pathname === '/') {
    chrome.runtime.sendMessage({
        action: 'signedIn'
    });
  } else if (location.pathname === '/signin') {
    const observer = new MutationObserver(function(mutationsList, observer) {
      if (location.pathname === '/') {
        chrome.runtime.sendMessage({
          action: 'signedIn'
        });
        observer.disconnect();
      }
    });
    observer.observe(document.querySelector('app-root'), {
      attributes: false,
      childList: true,
      subtree: false,
    });
  }
} else if (location.origin === 'https://calendar.google.com') {
  loadTray();
} else if (isMeetingAppRunning()) {
  let isMeetingLive = location.pathname !== '/';
  // Autoopen when user is viewing a Google Meet meeting.
  console.log("meeting application is running");

  if(location.host.includes("meet.google.com")) {
    if (isMeetingLive) {
      loadTray();
    }
  }

  chrome.runtime.sendMessage({
    action: 'openPopup',
    popup: ''
  });

  // if(location.host.includes('zoom.us')) {
  //   injectIframe();
  // }
  // By default, we set browser action is set both to trigger the popup(set in
  // manifest.json) and to send the 'load' message to the tab (set in
  // background.ts).
  //
  // When browser action triggers are set, Chrome will only trigger the popup.
  // This is the behavior we want on most pages.
  //
  // On Google Meet pages, we want the browser action to trigger the 'load'
  // message and not the popup. We do that by removing the popup:
  
  // In background.ts, upon receiving this message, we remove the popup for
  // the current tab. It appears that we don't need to set the popup again if
  // the user navigates to a non-Google Meet page later in the same tab,
  // because it looks like Chrome automatically resets the browser action to
  // the default on every page navigation.
  // Here we listen for the browser action to send us the 'load' message.
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action == 'loadTray') {
      loadTray();
    }
  });
}