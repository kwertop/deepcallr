// $(document).ready(function () {

  console.log("inside content script");

  var meetcss = chrome.runtime.getURL("style.css");
  $('<link rel="stylesheet" type="text/css" href="' + meetcss + '" >').appendTo("head");

  var bootstrapMinCss = chrome.runtime.getURL("bootstrap.min.css");
  $('<link rel="stylesheet" type="text/css" href="' + bootstrapMinCss + '" >').appendTo("head");

  var jqueryCss = chrome.runtime.getURL("jquery-ui.min.css");
  $('<link rel="stylesheet" type="text/css" href="' + jqueryCss + '" >').appendTo("head");

  var bootstrapMinJs = chrome.runtime.getURL("bootstrap.bundle.min.js");
  $('<script type="text/javascript" href="' + bootstrapMinJs + '" ></script>').appendTo("head");

  var jqueryUiJs = chrome.runtime.getURL("jquery-ui.min.js");
  $('<script type="text/javascript" href="' + jqueryUiJs + '" ></script>').appendTo("head");

  var jqueryJs = chrome.runtime.getURL("jquery-3.6.0.min.js");
  $('<script type="text/javascript" href="' + jqueryJs + '" ></script>').appendTo("head");

  var myscriptJs = chrome.runtime.getURL("script.js");
  $('<script type="text/javascript" href="' + myscriptJs + '" ></script>').appendTo("head");

  // $.get("tray.html", function(data){
  // });

  var data = '<div id="meetheon" class="tray"><div id="move" class="icon-tray img-container"><div data-toggle="tooltip" data-placement="right" title="Drag"><img src="' +
    dragIconUrl + '" alt="Drag Me" class="img"></div></div><div id="hidecc" class="icon-tray img-container"><div data-toggle="tooltip" data-placement="right" title="Hide Captions"><img src="' +
    newspaperIconUrl + '" alt="Hide Captions" class="img"></div></div><div id="exportcc" class="icon-tray img-container"><div data-toggle="tooltip" data-placement="right" title="Export Transcription"><img src="' +
    downloadIconUrl + '" alt="Export Transcription" class="img"></div></div></div>';

  // $("div").last().after(data);
  $('body').append(data);