let selectedLang = "en-us";

function initHooks() {
  $(".submit-button").click(function() {
    selectedLang = document.getElementById('lang-select-opt').value;
    $(".language-screen").hide();
    $(".transcribe-area").show();
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
    console.log("mouse is down");
    $(".wrapper").draggable("enable");
  });

  $(".fag").mouseout(function() {
    console.log("mouse is up");
    $(".wrapper").draggable("disable");
  });

  $(".fax").click(function() {
    $(".wrapper").remove();
  });

  showTime();
  showSpeechToText(selectedLang);
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

function showSpeechToText(lang) {

  if (false) {
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
  else {
    let localStream;
    let socket = null;
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
        socket = io.connect(`http://localhost:3000?token=${accessToken}&lang=${lang}`);
        setupRealtimeTranscription(socket, recorder);
      }

      socket.emit("join", roomId);
    }

    const stop = () => {
      // recorder.stop();
      // socket.close();
    };

    const start = async () => {
      let stream = await navigator.mediaDevices.getUserMedia({ audio: true }).then(onSuccess, onError);
    };

    var listening = false;
    $("#btn-play").click( function() {
      $("#icon-play").toggle();
      $("#icon-pause").toggle();
      listening ? stop() : start();
      listening = !listening;
    });
  }
}

function setupRealtimeTranscription(socket, recorder) {
  var speaker = null;
  var appName = getClientName();
  const findSpeaker = (mutationList, observer) => {
    mutationList.forEach( function(mutation) {
      if (mutation.type === 'attributes') {
        let target = mutation.target;
        if(appName === 'meet') {
          if(target.attributes.jscontroller && target.attributes.jscontroller.nodeValue === 'ES310d') {
            console.log(target);
            let containerNode = target.parentNode.parentNode.parentNode;
            let element = containerNode.querySelector('[data-self-name="You"]');
            speaker = element.innerHTML;
          }
        }
        else if(appName === 'zoom') {
          if(target.attributes.class && target.attributes.class.nodeValue === 'participants-icon__participants-mute-animation') {
            console.log(target);
            let containerNode = target.parentNode.parentNode.parentNode;
            let element = containerNode.querySelector('[class="participants-item__display-name"]');
            speaker = element.innerHTML;
          }
        }
      }
      console.log(mutation);
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

  socket.on("can-open-mic", () => {
    console.log("can open mic");
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
    if(parsedData.is_final && (lastEventTime == null || Math.abs((now - lastEventTime)/1000) >= 5 || lastSpeaker !== speaker)) {
      if(finalTranscript !== "") {
        const newSpeaker = {
          "speaker": speaker,
          "time": timeStr
        }
      }
      socket.emit("new-speaker", JSON.stringify(newSpeaker));
      finalTranscript = "";
      let date = new Date();
      let h = date.getHours();
      let m = date.getMinutes();
      let s = date.getSeconds();
      timeStr = h + ":" + m + ":" + s;
      const pTimeTag = "<p class='time'>" + timeStr + ",<b>" + speaker + "</b></p>";
      const finalSpan = "<span class='text-dark final'></span>";
      const interimSpan = "<span class='text-secondary interim'></span>";
      $(".transcript-area").append(pTimeTag);
      $(".transcript-area").append(finalSpan);
      $(".transcript-area").append(interimSpan);
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
    lastEventTime = now;
    lastSpeaker = speaker;
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