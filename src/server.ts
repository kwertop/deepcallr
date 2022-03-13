import express = require("express");
import * as http from "http";
import WebSocket = require("ws");
import { Deepgram } from "@deepgram/sdk";
import { LiveTranscriptionOptions } from "@deepgram/sdk/dist/types";
import { Socket } from "socket.io";
import { Room } from "socket.io-adapter";
import cors from 'cors';
import DBConnection from "./dbConnection";
import { UserAccount } from "./entity/UserAccount";
import { Subscription } from "./entity/Subscription";
import { Plan } from "./entity/Plan";
import { getRepository, Repository } from "typeorm";
import MeetingRoom from "./rooms/MeetingRoom";

const deepGramKey = process.env.DG_KEY || "5ef9c14df93cf250e88f7418e37ec301cfb90cf4";
const fs = require('fs');
const Sanscript = require('@sanskrit-coders/sanscript');

if (deepGramKey === "") {
  throw "You must define deepGramKey in your .env file";
}

const app = express();

app.use(express.static('public'));

app.use(cors<express.Request>({
  origin: ["*", "null"],
  methods: "*",
  credentials: true
}));

let server = http.createServer(app);

const MAX_CLIENTS = 1;

const SocketIoServer = require("socket.io").Server;
const io = new SocketIoServer(server, {
  cors: {
    origin: "*",
    methods: "*"
  }
});

let userRepo: Repository<UserAccount>;
let subscriptionRepo: Repository<Subscription>;
let planRepo: Repository<Plan>;

let audioFileName: string;
let transciptionFileName: string;
let captionsFileName: string;

io.use(async (socket: any, next: any) => {
  if(socket.handshake.query && socket.handshake.query.token) {
    let user: UserAccount = await userRepo.findOne({ token: socket.handshake.query.token });
    if(user) {
      let activeSubscription: Subscription = await subscriptionRepo.findOne({ userId: user.id, status: 1 });
      if(activeSubscription) {
        const plan: Plan = await planRepo.findOne({ id: activeSubscription.planId });
        let minutesPerMonth: number = plan.minutesPerMonth;
        if(activeSubscription.minutesUsed < minutesPerMonth) {
          let meetingRoom: MeetingRoom = new MeetingRoom(user, activeSubscription, minutesPerMonth);
          meetingRoom.initMeetingNote(socket.handshake.query.meetingApp, socket.handshake.query.meetingCode);
          socket.data = meetingRoom;
          next();
        }
        else {
          next(new Error('Monthly Minutes Exhausted. Please renew subscription.'));    
        }
      }
      else {
        next(new Error('No Active Subscription found for this user.'));  
      }
    }
    else {
      next(new Error('Authentication error'));
    }
  }
  else {
    next(new Error('Authentication error'));
  }
});

io.sockets.on("connection", handle_connection);

function handle_connection(socket: Socket) {
  const rooms = io.of("/").adapter.rooms;
  const meetingRoom: MeetingRoom = socket.data;

  socket.on("join", (room: Room) => {

    let clientsCount = 0;
    if (rooms[room]) {
      clientsCount = rooms[room].length;
    }

    console.log("clientsCount: " + clientsCount)
    if (clientsCount >= MAX_CLIENTS) {
      console.log("room full");
      socket.emit("full", room);
    }
    else {
      socket.join(room);

      console.log("room joined");

      meetingRoom.startMinutesTimer(socket);

      const lang: string = String(socket.handshake.query.lang);
      setupRealtimeTranscription(socket, room, lang);

      socket.on("complete-dialogue", (data) => {
        const dialogue = JSON.parse(data);
        const newLine = dialogue["time"] + ", " + dialogue["speaker"] + ": " + dialogue["transcript"] + "\r\n";
        meetingRoom.appendDialog(newLine);
        let transcript = {
          speaker: dialogue["speaker"],
          startTime: dialogue["time"],
          sentence: dialogue["transcript"],
          seeks: meetingRoom.getCaptions()
        }
        meetingRoom.displayTranscript.push(transcript);
        meetingRoom.flushCaptions();
      });

      socket.on("incomplete-dialogue", (data) => {
        const dialogue = JSON.parse(data);
        const newLine = dialogue["time"] + ", " + dialogue["speaker"] + ": " + dialogue["transcript"] + "\r\n";
        meetingRoom.appendDialog(newLine);
        let transcript = {
          speaker: dialogue["speaker"],
          startTime: meetingRoom.getCaptions()[0].start,
          sentence: dialogue["transcript"],
          seeks: meetingRoom.getCaptions()
        }
        meetingRoom.displayTranscript.push(transcript);
        meetingRoom.flushCaptions();
      })
    }
  });
}

const saveAudioToDisk = (audioBlob: any) => {
  fs.writeFile(audioFileName, audioBlob, (err) => {console.log("error while writing audio: ", err);})
}

function setupRealtimeTranscription(socket: Socket, room: Room, lang: string) {
  /** The sampleRate must match what the client uses. */
  const sampleRate = 16000;
  let dialogue: string = "";
  let speaker: string = "";
  let dialogueTime: string = "";
  let audioChunks: Array<any> = [];
  const meetingRoom: MeetingRoom = socket.data;

  console.log("language Selected: ", lang);
  const deepgram = new Deepgram(deepGramKey);
  const transcriptionOptions: LiveTranscriptionOptions = {
  	version: "latest",
  	punctuate: true,
    language: lang
  };

  const dgSocket = deepgram.transcription.live(transcriptionOptions);

  console.log("deepgram inititalized");

  /** We must receive the very first audio packet from the client because
   * it contains some header data needed for audio decoding.
   *
   * Thus, we send a message to the client when the socket to Deepgram is ready,
   * so the client knows it can start sending audio data.
   */
  dgSocket.addListener("open", () => socket.emit("can-open-mic"));

  /**
   * We forward the audio stream from the client's microphone to Deepgram's server.
   */
  socket.on("microphone-stream", (stream) => {
    audioChunks.push(stream);
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.send(stream);
    }
  });

  /** On Deepgram's server message, we forward the response back to all the
   * clients in the room.
   */
  dgSocket.addListener("transcriptReceived", (transcription) => {
    let parsedData = JSON.parse(transcription);
    if(lang === 'hi') {
      parsedData["channel"]["alternatives"][0]["transcript"] = Sanscript.t(parsedData["channel"]["alternatives"][0]["transcript"],
        'devanagari', 'hk');
    }
    let alternatives = parsedData["channel"]["alternatives"][0];
    if(alternatives["words"].length > 0 && alternatives["confidence"] > 0.4) {
      io.to(room).emit("transcript-result", socket.id, transcription);
      if(parsedData.is_final) {
        let caption = {
          "start": Math.floor(parsedData.start),
          "duration": parsedData.duration,
          "end": Math.floor(parsedData.start + parsedData.duration),
          "words": alternatives["transcript"]
        }
        meetingRoom.pushIntoCaptions(caption);
      }
    }
  });

  /** We close the dsSocket when the client disconnects. */
  socket.on("disconnect", () => {
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.finish();
    }
    meetingRoom.setMeetingEndTime();
    meetingRoom.saveAudioToDisk(audioChunks);
    meetingRoom.saveCaptionsToDisk();
    meetingRoom.uploadFilesToS3();
    meetingRoom.indexToElastic();
    socket.broadcast.to(room).emit("bye", socket.id);
    meetingRoom.unsetTimer();
    meetingRoom.delFilesAndFolders();
  });
}

const port = process.env.PORT || 3200;

async function startServer() {
  try {
    await DBConnection.getDBConnection();

    userRepo = getRepository(UserAccount);
    subscriptionRepo = getRepository(Subscription);
    planRepo = getRepository(Plan);

    server.listen(port, () =>
      console.log(`Server is running on port ${port}`)
    );
  } catch (err) {
    console.log("start server: ", err);
    return;
  }
}

startServer();