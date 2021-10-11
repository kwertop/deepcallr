// $(document).ready(function () {

  console.log("inside content script");

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

  // $.get("tray.html", function(data){
  // });

  var data = $("<input type='checkbox' id='click'>" +
    "<label class='callr-icon' for='click'>" +
      "<i class='fab fa-solid fa-scroll'></i>" +
      "<i class='fas fa-times'></i>" +
    "</label>" +
    "<div class='wrapper'>" +
      "<div class='head-text'>Callr</div>" +
      "<div class='language-screen'>" +
        "<div class='label-div'>Please Choose a Language</div>" +
        "<div class='lang-select-div'>" +
          "<select class='lang-select' aria-label='Default select example'>" +
            "<option selected>English - IN</option>" +
            "<option value='1'>English - US</option>" +
            "<option value='2'>Hindi</option>" +
            "<option value='3'>Spanish</option>" +
            "<option value='4'>French</option>" +
            "<option value='5'>Korean</option>" +
          "</select>" +
        "</div>" +
        "<div class='submit-div'>" +
          "<button class='btn btn-primary submit-button'>Submit</button>" +
        "</div>" +
      "</div>" +
      "<div class='transcribe-area' style='display: none;'>" +
        "<div class='tray'>" +
          "<button class='button play' id='btn-play'>          " +
            "<i class='iplay fa-solid fa-microphone-lines' id='icon-play' style='display: none;'></i>" +
            "<i class='iplay fa-solid fa-microphone-lines-slash' id='icon-pause'></i>" +
          "</button>" +
          "<button class='button play'>" +
            "<i class='iplay fa-solid fa-circle-stop'></i>" +
          "</button>" +
          "<button class='button play'>" +
            "<i class='iplay fa-solid fa-up-right-from-square'></i>" +
          "</button>" +
          "<button class='button play'>" +
            "<i class='iplay fa-solid fa-closed-captioning'></i>" +
          "</button>" +
          "<button class='button play'>" +
            "<i class='iplay fa-solid fa-file-lines'></i>" +
          "</button>" +
        "</div>" +
        "<div class='desc-text' id='time-text'>" +
        "</div>" +
        "<div class='transcript-area'>" +
        "</div>" +
      "</div>" +
    "</div>");

  // $("div").last().after(data);
$(document).ready(function() {
  $('body').append(data);
  // $('.T4LgNb').append(data);
  // console.log($('.T4LgNb'));
  console.log("html data inserted");
  $(".submit-button").click(function() {
    $(".language-screen").hide();
    $(".transcribe-area").show();
  });  
  showTime();
  showSpeechToText();
});