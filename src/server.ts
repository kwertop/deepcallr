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

const deepGramKey = process.env.DG_KEY || "5ef9c14df93cf250e88f7418e37ec301cfb90cf4";
const fs = require('fs');

if (deepGramKey === "") {
  throw "You must define deepGramKey in your .env file";
}

const app = express();

app.use(express.static('public'))

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

const user: UserAccount = null;
const minutesCounter: NodeJS.Timer = null;
const userRepo: Repository<UserAccount> = getRepository(UserAccount);
const subscriptionRepo: Repository<Subscription> = getRepository(Subscription);
const planRepo: Repository<Plan> = getRepository(Plan);
let activeSubscription: Subscription = null;
let minutesUsedTillNow: number = 0;
let minutesPerMonth: number = 0;

io.use((socket, next) => {
  if(socket.handshake.query && socket.handshake.query.token) {
    user = await userRepo.findOne({ token: token });
    if(user) {
      activeSubscription = await subscriptionRepo.findOne({ userId: user.id, status: 1 });
      if(activeSubscription) {
        minutesUsedTillNow = activeSubscription.minutesUsed;
        const plan: Plan = await planRepo.findOne({ id: activeSubscription.plan_id });
        minutesPerMonth = plan.minutesPerMonth;
        if(activeSubscription.minutesUsed < minutesPerMonth) {
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

  socket.on("join", (room: Room) => {

    let clientsCount = 0;
    if (rooms[room]) {
      clientsCount = rooms[room].length;
    }

    console.log("clientsCount: " + clientsCount)
    if (clientsCount >= MAX_CLIENTS) {
      console.log("room full");
      socket.emit("full", room);
    } else {
      socket.join(room);

      console.log("room joined");

      minutesCounter = setInterval( () => {
        await subscriptionRepo.createQueryBuilder()
          .update()
          .set({
            minutesUsed: () => "minutesUsed + 1"
          })
          .where("id = :id", { id: activeSubscription.id })
          .execute();
        minutesUsedTillNow += 1;
        if(minutesUsedTillNow >= minutesPerMonth) {
          socket.emit("monthly-limit-reached");
          socket.disconnect(0);
        }
      }, 60000);

      const lang: string = String(socket.handshake.query.lang);
      setupRealtimeTranscription(socket, room, lang);

      socket.on("disconnect", () => {
        socket.broadcast.to(room).emit("bye", socket.id);
        clearInterval(minutesCounter);
        minutesCounter = undefined;
      });

      socket.on("complete-dialogue", (data) => {
        const dialogue = JSON.parse(data);
        const newLine = data["time"] + ", " + data["speaker"] + ": " + data["transcript"] + "\r\n";
        fs.appendFile('~/Documents/meeting.txt', newLine, (err) => {
          if(err) {
            //
          }
          else {
            //
          }
        });
      })
    }
  });
}

function setupRealtimeTranscription(socket: Socket, room: Room, lang: string) {
  /** The sampleRate must match what the client uses. */
  const sampleRate = 16000;

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
    console.log("here");
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.send(stream);
    }
  });

  /** On Deepgram's server message, we forward the response back to all the
   * clients in the room.
   */
  dgSocket.addListener("transcriptReceived", (transcription) => {
    console.log("transcriptReceived");
    io.to(room).emit("transcript-result", socket.id, transcription);
  });

  /** We close the dsSocket when the client disconnects. */
  socket.on("disconnect", () => {
    if (dgSocket.getReadyState() === WebSocket.OPEN) {
      dgSocket.finish();
    }
  });
}
const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await DBConnection.getDBConnection();

    server.listen(port, () =>
      console.log(`Server is running on port ${port}`)
    );
  } catch (err) {
    console.log("start server: ", err);
    return;
  }
}

startServer();