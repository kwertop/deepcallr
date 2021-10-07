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
  console.log("showTime called first time");
  if(node) {
    console.log("node found");
    node.innerText = time;
    node.textContent = time;
  
    setTimeout(showTime, 1000);
  }
}

function isChrome() {
  return !!window.chrome && !!window.chrome.app && !navigator.brave;
}

function showSpeechToText() {
  if (isChrome()) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    var listening = false;
    let finalTranscript = "";
    let lastEventTime = null;
    let lastIndex = -1;
    
    const stop = () => {
      recognition.stop();
      // button.textContent = "Start listening";
    };

    const start = () => {
      recognition.start();
      // button.textContent = "Stop listening";
    };

    const onResult = event => {
      const now = new Date();
      if(lastEventTime == null || Math.abs((now - lastEventTime)/1000) >= 5) {
        finalTranscript = "";
        let date = new Date();
        let h = date.getHours();
        let m = date.getMinutes();
        let s = date.getSeconds();
        const pTimeTag = "<p class='time'>" + h + ":" + m + ":" + s + "</p>";
        const finalSpan = "<span class='text-dark final'></span>";
        const interimSpan = "<span class='text-secondary interim'></span>";
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
    };

    recognition.continuous = true;
    recognition.interimResults = true;
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

    const recorder = new Recorder({
      encoderPath: "/encoderWorker.min.js",
      leaveStreamOpen: true,
      numberOfChannels: 1,

      // OPUS options
      encoderSampleRate: sampleRate,
      streamPages: true,
      maxBuffersPerPage: 1,
    });

    const stop = () => {
      recorder.stop();
      socket.close();
    };

    const start = () => {
      try {
        localStream = navigator.mediaDevices.getUserMedia({
          audio: true
        });
      } catch {
        alert(
          "No microphone found. Please activate your microphone and refresh the page."
        );
        return;
      }

      if(socket == null) {
        socket = io.connect("http://localhost:3000");
        setupRealtimeTranscription(socket, recorder);
      }

      socket.emit("join", roomId);
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
  let finalTranscript = "";
  let lastEventTime = null;
  let interimTranscript = "";

  socket.on("can-open-mic", () => {
    console.log("can open mic");
    recorder.start();
  });

  /** We forward our audio stream to the server. */
  recorder.ondataavailable = (e) => {
    socket.emit("microphone-stream", e.buffer);
  };

  socket.on("transcript-result", (socketId, data) => {
    console.log(data);
    let parsedData = JSON.parse(data);
    let alternatives = parsedData["channel"]["alternatives"][0];
    if(alternatives["words"].length == 0 && alternatives["confidence"] < 0.25) {
      return;
    }
    const now = new Date();
    if(lastEventTime == null || Math.abs((now - lastEventTime)/1000) >= 5) {
      finalTranscript = "";
      let date = new Date();
      let h = date.getHours();
      let m = date.getMinutes();
      let s = date.getSeconds();
      const pTimeTag = "<p class='time'>" + h + ":" + m + ":" + s + "</p>";
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
  });
}

$(document).ready(function() {
 //  $(".submit-button").click(function() {
 //    $(".language-screen").hide();
 //    $(".transcribe-area").show();
 //  });
 //  console.log("script function called");
 // showTime();
 //  showSpeechToText();

	// $("#btn-play").click(function() {
		// $("#icon-play").toggle();
		// $("#icon-pause").toggle();

		// if($("#icon-pause").is(':visible')) {
		// 	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		// 		console.log('getUserMedia supported.');
		// 		navigator.mediaDevices.getUserMedia (
		// 		// constraints - only audio needed for this app
		// 		{
		// 			audio: true
		// 		})
		// 		// Success callback
		// 		.then(function(stream) {
		// 			console.log("audio heard");
		// 		})

		// 		// Error callback
		// 		.catch(function(err) {
		// 	   console.log('The following getUserMedia error occurred: ' + err);
		// 		});
		// 	} else {
		// 		console.log('getUserMedia not supported on your browser!');
		// 	}
		// }
	// });
});