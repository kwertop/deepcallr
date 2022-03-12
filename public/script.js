let selectedLang = "en-us";
var socket = null;
let buckBeakAccessToken = "";
let isUserLoggedIn = false;
let loginInterval = null;

function initHooks() {
  checkIfLoggedIn();

  $(".submit-button").click(function() {
    selectedLang = document.getElementById('lang-select-opt').value;
    $(".language-screen").hide();
    $(".transcribe-area").show();
    $("#error-box").hide();
    showTime();
    showSpeechToText(selectedLang);
  });
  $("#hide-scribe").click(function() {
    if($("#conversation-block").hasClass("transcript-area-hidden")) {
      $("#conversation-block").addClass("transcript-area");
      $("#conversation-block").removeClass("transcript-area-hidden");
      $(".wrapper").removeClass("wrapper-height-cc-hidden");
      $(".wrapper").addClass("wrapper-height-cc-visible");
    }
    else {
      $("#conversation-block").addClass("transcript-area-hidden");
      $("#conversation-block").removeClass("transcript-area");
      $(".wrapper").removeClass("wrapper-height-cc-visible");
      $(".wrapper").addClass("wrapper-height-cc-hidden");
    }
  });

  $(".wrapper").draggable({ containment: 'window', scroll: false });
  $(".wrapper").draggable("disable");

  $(".fag").mousedown(function() {
    // console.log("mouse is down");
    $(".wrapper").draggable("enable");
  });

  $(".fag").mouseout(function() {
    // console.log("mouse is up");
    $(".wrapper").draggable("disable");
  });

  $(".fax").click(function() {
    $(".wrapper").remove();
    if(socket) {
      socket.disconnect();
    }
  });

  $(".closebtn").click(() => {
    $("#error-box").hide();
  });

  $(".signup-button").click(() => {
    chrome.runtime.sendMessage({ action: 'openSignUpPage' });
  });

  $(".login-link").click(() => {
    chrome.runtime.sendMessage({ action: 'openLoginPage' });
  });
}

function checkIfLoggedIn() {
  chrome.runtime.sendMessage({
    action: 'getAccessToken'
  }, (response) => {
    buckBeakAccessToken = response.token;
    if(buckBeakAccessToken) {
      $('.login-screen').hide();
      $('.language-screen').show();
      if(loginInterval) {
        clearInterval(loginInterval);
      }
    }
    else {
      if(loginInterval == null) {
        loginInterval = setInterval(checkIfLoggedIn, 500);
      }
    }
  });
}

function showTime() {
  var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec" ];
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var date = new Date();
  var wd = days[date.getDay()];
  var d = date.getDate();
  var mo = monthNames[date.getMonth()];
  var y = date.getFullYear();
  var h = date.getHours(); 
  var m = date.getMinutes(); 
  var s = date.getSeconds(); 
  var session = "AM";
  
  if(h == 0) {
    h = 12;
  }
  
  if(h > 12) {
    h = h - 12;
    session = "PM";
  }
  
  h = (h < 10) ? "0" + h : h;
  m = (m < 10) ? "0" + m : m;
  s = (s < 10) ? "0" + s : s;
  
  var time = wd + ", " + mo + " " + d + " " + y + ". " + h + ":" + m + ":" + s + " " + session;
  let node = document.getElementById("time-text");
  if(node) {
    node.innerText = time;
    node.textContent = time;
    setTimeout(showTime, 1000);
  }
}

function isChrome() {
  return !!window.chrome && !!window.chrome.app && !navigator.brave;
}

function useWebkitSpeechRecognition(lang) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  var listening = false;
  let finalTranscript = "";
  let lastEventTime = null;
  let lastIndex = -1;
  let lastSpeaker = null;

  const stop = () => {
    recognition.stop();
  };

  const start = () => {
    recognition.start();
  };

  const onAudioStart = () => {
    console.log("audio started");
    speaker = findSpeaker();
  }

  const onResult = event => {
    const now = new Date();
    if(lastEventTime == null || Math.abs((now - lastEventTime)/1000) >= 5 || lastSpeaker !== speaker) {
      finalTranscript = "";
      let date = new Date();
      let h = date.getHours();
      let m = date.getMinutes();
      let s = date.getSeconds();
      const pTimeTag = "<p class='time'>" + h + ":" + m + ":" + s + ",<b>" + speaker + "</b></p>";
      const finalSpan = "<span class='text-dark final'></span>";
      const interimSpan = "<span class='text-secondary interim'></span>";
      console.log($(".transcript-area"));
      $(".transcript-area").append(pTimeTag);
      $(".transcript-area").append(finalSpan);
      $(".transcript-area").append(interimSpan);
    }
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      if (res.isFinal && i > lastIndex) {
        finalTranscript += res[0].transcript;
        lastIndex = i;
      } else {
        interimTranscript += res[0].transcript;
      }
    }
    console.log("finalTranscript: " + finalTranscript);
    console.log("interimTranscript: " + interimTranscript);
    $("span.final:last").html(finalTranscript);
    $("span.interim:last").html(interimTranscript);
    lastEventTime = now;
    lastSpeaker = speaker;
  };

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onspeechstart = onAudioStart;
  recognition.onresult = onResult;
  $("#btn-play").click( function() {
    $("#icon-play").toggle();
    $("#icon-pause").toggle();
    listening ? stop() : start();
    listening = !listening;
  });
}

async function useWebRTCStream(lang) {
  let localStream;
  const roomId = "room123";
  const sampleRate = 16000;
  let recorder = null;

  const onError = (err) => {
    console.log('The following error occured: ' + err);
  }

  const onSuccess = (stream) => {
    this.audioContext = new this.AudioContext();
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    let gain = this.audioContext.createGain();
    this.mediaStreamSource.connect(gain);
    document.querySelectorAll("audio")
    .forEach(e => {
      let t = e.captureStream();
      this.audioContext.createMediaStreamSource(t).connect(gain);
    });
    let dest = this.audioContext.createMediaStreamDestination();
    gain.connect(dest);
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(dest.stream)
    const options = {
      audioBitsPerSecond :  64000,
      mimeType : 'audio/webm;codecs=opus'
    }
    recorder = new MediaRecorder(this.mediaStreamSource.mediaStream, options);
    if(socket == null) {
      const accessToken = window.localStorage.getItem("accessToken");
      socket = io.connect(`https://sock.yellof.in?token=${buckBeakAccessToken}&lang=${lang}&meetingApp=GoogleMeet&meetingCode=vgp-jgkb-zsc`);
      setupRealtimeTranscription(socket, recorder);

      // socket.on('connect_failed', (err) => console.log(err.message));
      socket.on('connect_error', (err) => {
        document.getElementById("err-span").innerText = err.message + 'Error Error Error Error Error Error Error Error';
        $("#error-box").show();
      });

      socket.on('connect_failed', (err) => {
        document.getElementById("err-span").innerText = err.message + 'Error Error Error Error Error Error Error Error';
        $("#error-box").show();
      });
    }

    socket.emit("join", roomId);
  }

  const pause = () => {
    recorder.pause();
    // socket.close();
  };

  const resume = () => {
    recorder.resume();
  }

  const start = async () => {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true }).then(onSuccess, onError);
  };

  const stop = async () => {
    recorder.stop();
    socket.close();
  }

  var listening = true;
  await start();

  $("#btn-play").click( function() {
    $("#icon-play").toggle();
    $("#icon-pause").toggle();
    listening ? pause() : resume();
    listening = !listening;
  });
}

async function useChromeTabCapture(lang, streamId) {
  let localStream;
  const roomId = "room123";
  const sampleRate = 16000;
  let recorder = null;

  const onError = (err) => {
    console.log('The following error occured: ' + err);
  }

  const onSuccess = (stream) => {
    this.audioContext = new this.AudioContext();
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    let gain = this.audioContext.createGain();
    this.mediaStreamSource.connect(gain);
    // navigator.mediaDevices.getUserMedia({
    //   audio: {
    //     mandatory: {
    //       chromeMediaSource: 'tab',
    //       chromeMediaSourceId: streamId
    //     }
    //   }
    // })

    // chrome.runtime.onMessage.addListener((message, sender, response) => {
    //   if(message.action === "stream") {
    //     this.audioContext.createMediaStreamSource(message.stream).connect(gain);
    //   }
    // });
    // navigator.mediaDevices.getUserMedia({
    //   audio: {deviceId: 'c8dd940f578424cdd71220bd6dcd5fb5ced5b3e992e3db3c24a3c49186c7638c'}
    // }).then((tabStream) => {
    //   this.audioContext.createMediaStreamSource(tabStream).connect(gain);
    // }, (error) => { console.log("error while fetching tab stream ", error); });
    // chrome.tabCapture.capture({
    //   audio: true,
    //   audioConstraints: {
    //     mandatory: {
    //       echoCancellation: true
    //     }
    //   }
    // }, (tabStream) => {
    //   this.audioContext.createMediaStreamSource(tabStream).connect(gain);
    // });

    navigator.mediaDevices.getUserMedia({
      video: {
        mandatory: {
          chromeMediaSource: 'screen',
          chromeMediaSourceId: streamId,
        },
      },
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: streamId,
        },
      }
    }, (tabStream) => {
      tabStream.removeTrack(stream.getVideoTracks()[0]);
      this.audioContext.createMediaStreamSource(tabStream).connect(gain);
    });
    let dest = this.audioContext.createMediaStreamDestination();
    gain.connect(dest);
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(dest.stream)
    const options = {
      audioBitsPerSecond :  64000,
      mimeType : 'audio/webm;codecs=opus'
    }
    recorder = new MediaRecorder(this.mediaStreamSource.mediaStream, options);
    if(socket == null) {
      const accessToken = window.localStorage.getItem("accessToken");
      socket = io.connect(`https://sock.yellof.in?token=${buckBeakAccessToken}&lang=${lang}&meetingApp=Zoom&meetingCode=7232549512`);
      setupRealtimeTranscription(socket, recorder);

      socket.on('connect_error', (err) => {
        document.getElementById("err-span").innerText = err.message + 'Error Error Error Error Error Error Error Error';
        $("#error-box").show();
      });

      socket.on('connect_failed', (err) => {
        document.getElementById("err-span").innerText = err.message + 'Error Error Error Error Error Error Error Error';
        $("#error-box").show();
      });
    }

    socket.emit("join", roomId);
  }

  const pause = () => {
    recorder.pause();
    // socket.close();
  };

  const resume = () => {
    recorder.resume();
  }

  const start = async () => {
    let stream = await navigator.mediaDevices.getUserMedia({ audio: true }).then(onSuccess, onError);
  };

  const stop = async () => {
    recorder.stop();
    socket.close();
  }

  var listening = true;
  await start();

  $("#btn-play").click( function() {
    $("#icon-play").toggle();
    $("#icon-pause").toggle();
    listening ? pause() : resume();
    listening = !listening;
  });
}

function showSpeechToText(lang) {
  if (getClientName() === "meet") {
    useWebRTCStream(lang);
  }
  else {
    chrome.storage.sync.get(['buckBeakStreamId'], function(result) {
      console.log('retrieved StreamId: ', result.buckBeakStreamId);
      useChromeTabCapture(lang, result.streamId);
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, response) => {
  if(message.action === "streamId") {
    chrome.storage.sync.set({buckBeakStreamId: message.streamId}, function() {
      console.log('Value is set to ' + message.streamId);
    });
  }
});

function setupRealtimeTranscription(socket, recorder) {
  var speaker = null;
  var appName = getClientName();
  const findSpeaker = (mutationList, observer) => {
    mutationList.forEach( function(mutation) {
      if (mutation.type === 'attributes') {
        let target = mutation.target;
        if(appName === 'meet') {
          if(target.attributes.jscontroller && target.attributes.jscontroller.nodeValue === 'ES310d') {
            // console.log(target);
            let containerNode = target.parentNode.parentNode.parentNode;
            let element = containerNode.querySelector('[data-self-name="You"]');
            speaker = element.innerHTML;
          }
        }
        else if(appName === 'zoom') {
          if(target.attributes.class && target.attributes.class.nodeValue === 'participants-icon__participants-mute-animation') {
            // console.log(target);
            let containerNode = target.parentNode.parentNode.parentNode;
            let element = containerNode.querySelector('[class="participants-item__display-name"]');
            speaker = element.innerHTML;
          }
        }
      }
      // console.log(mutation);
    });
  }

  const elem = document.querySelector('body');
  var config = { attributes: true, childList: true, subtree: true };
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  const observer = new MutationObserver(findSpeaker);
  observer.observe(elem, config);

  let finalTranscript = "";
  let lastEventTime = null;
  let interimTranscript = "";
  let lastSpeaker = null;
  let timeStr = "";
  let firstEvent = true;

  socket.on("can-open-mic", () => {
    console.log("can open mic");
    $("#btn-play").prop('disabled', false);
    $("#btn-stop").prop('disabled', false);
    $("#btn-highlight").prop('disabled', false);
    $("#hide-scribe").prop('disabled', false);
    $("#to-buckbeak").prop('disabled', false);
    recorder.start(1000);
  });

  /** We forward our audio stream to the server. */
  recorder.ondataavailable = (e) => {
    console.log("data available");
    socket.emit("microphone-stream", e.data);
  };

  socket.on("transcript-result", (socketId, data) => {
    console.log(data);
    let parsedData = JSON.parse(data);
    let alternatives = parsedData["channel"]["alternatives"][0];
    if(alternatives["words"].length == 0 && alternatives["confidence"] < 0.25) {
      return;
    }
    const now = new Date();
    console.log("time diff: ", Math.abs((now - lastEventTime)/1000));
    if(parsedData.is_final && (lastEventTime == null || Math.abs((now - lastEventTime)/1000) >= 2 || lastSpeaker !== speaker || firstEvent)) {
      console.log("new span creation");
      if(finalTranscript !== "") {
        const dialogue = {
          "speaker": lastSpeaker,
          "time": timeStr,
          "transcript": finalTranscript
        }
        socket.emit("complete-dialogue", JSON.stringify(dialogue));
      }
      finalTranscript = "";
      let date = new Date();
      let h = date.getHours();
      let m = date.getMinutes();
      let s = date.getSeconds();
      timeStr = h + ":" + m + ":" + s;
      const pTimeTag = "<p class='time'>" + timeStr + ",<b>" + speaker + "</b></p>";
      const finalSpan = "<span class='text-dark final'></span>";
      const interimSpan = "<span class='text-secondary interim'></span>";
      console.log("appending tags");
      $(".transcript-area").append(pTimeTag);
      $(".transcript-area").append(finalSpan);
      $(".transcript-area").append(interimSpan);
      firstEvent = false;
    }
    if(parsedData.is_final && alternatives["confidence"] >= 0.25) {
      finalTranscript += " " + alternatives["transcript"];
      interimTranscript = "";
    }
    else {
      interimTranscript += " " + alternatives["transcript"];
    }
    console.log("finalTranscript: " + finalTranscript);
    console.log("interimTranscript: " + interimTranscript);
    $("span.final:last").html(finalTranscript);
    $("span.interim:last").html(interimTranscript);

    const transcriptionBox = document.getElementById('conversation-block');
    let shouldScroll = transcriptionBox.scrollTop + transcriptionBox.clientHeight === transcriptionBox.scrollHeight;
    if(!shouldScroll) {
      transcriptionBox.scrollTop = transcriptionBox.scrollHeight;
    }
    lastSpeaker = speaker;
    lastEventTime = now;
  });

  $("#btn-stop").click( function() {
    if(socket !== null) {
      const dialogue = {
        "speaker": speaker,
        "time": timeStr,
        "transcript": finalTranscript
      }
      socket.emit("incomplete-dialogue", JSON.stringify(dialogue));
    }
  });
}

function isLoggedIn() {
  return !!window.localStorage.getItem('accessToken');
}

function getClientName() {
  if(window.location.origin.includes('meet.google.com')) {
    return 'meet';
  }
  else if(window.location.origin.includes('teams.microsoft')) {
    return 'teams';
  }
  else if(window.location.origin.includes('webex')) {
    return 'webex';
  }
  else if(window.location.origin.includes('zoom')) {
    return 'zoom';
  }
}

$(document).ready(function() {
});