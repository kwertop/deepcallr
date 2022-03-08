// chrome.tabs.query({
//   active: true,
//   currentWindow: true
// }, (tabs) => {
//   var tab = tabs[0];
//   console.error("from iframe: ", tab.id);
//   console.error("from iframe stream: ", stream);
//   chrome.tabCapture.capture({audio: true, video: false}, (stream) => {
//     chrome.tabs.sendMessage(tab.id, { action: 'stream', stream: stream });
//   });
// });

// chrome.runtime.onMessage.addListener((message, sender, response) => {
//   if(message.action === "streamId") {
//     navigator.mediaDevices.getDisplayMedia({
//       audio:{
//         mandatory: {
//           chromeMediaSource: 'tab',
//           chromeMediaSourceId: message.streamId
//         }
//       }
//     }).then((tabStream) => {
//       console.error("tabStream: ", tabStream);
//     })
//   }
// });