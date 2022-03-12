import { UserAccount } from "../entity/UserAccount";
import { Subscription } from "../entity/Subscription";
import { createMeetingNote, MeetingApp, MeetingNote } from "../entity/MeetingNote";
import { saveAudio } from "../services/concatenateBlobs";
import { ELASTIC_SEARCH_HOST, NOTES_BUCKET } from "../config";

import { getRepository, Repository } from "typeorm";
const fs = require('fs');
const rimraf = require("rimraf");
const AWS = require('aws-sdk');
import { Socket } from "socket.io";
import axios from 'axios';

export default class MeetingRoom {
	private user: UserAccount;
	private minutesCounter: NodeJS.Timer;
	private activeSubscription: Subscription;
	private meetingNote: MeetingNote;
	private meetingCode: string;
	private audioFileName: string;
	private transcriptionFileName: string;
	private captionsFileName: string;
	private minutesUsedTillNow: number;
	private subscriptionRepo: Repository<Subscription>;
	private minutesPerMonth: number;
  private fullTranscription: string;
  private captions: Array<any>;
  public displayTranscript: Array<any>;

	constructor(user: UserAccount, activeSubscription: Subscription, minutesPerMonth: number) {
		this.user = user;
		this.activeSubscription = activeSubscription;
		this.minutesUsedTillNow = this.activeSubscription.minutesUsed;
		this.minutesPerMonth = minutesPerMonth;
		this.subscriptionRepo = getRepository(Subscription);
    this.fullTranscription = "";
    this.captions = [];
    this.displayTranscript = [];
    AWS.config.update({
      accessKeyId: 'AKIAQKGYBVT4PPT4YLGU',
      secretAccessKey: '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',
      region: 'ap-south-1'
    });
    fs.mkdir(`/var/meetdata/${this.user.userId}/${this.meetingCode}`, { recursive: true }, (err) => {
      if (err) console.log("error while creating dir: ", err);
    });
	}

	public async initMeetingNote(meetingApp: string, viaMeetingCode: string) {
		this.meetingNote = await createMeetingNote(this.user.id, 'New Title', meetingApp, viaMeetingCode);
		this.meetingCode = this.meetingNote.code;
		this.setFileNames();
	}

	public startMinutesTimer(socket: Socket) {
		this.minutesCounter = setInterval( async () => {
      await this.subscriptionRepo.createQueryBuilder()
        .update()
        .set({
          minutesUsed: () => "minutes_used + 1"
        })
        .where("id = :id", { id: this.activeSubscription.id })
        .execute();
      this.minutesUsedTillNow += 1;
      if(this.minutesUsedTillNow >= this.minutesPerMonth) {
        socket.emit("monthly-limit-reached");
        socket.disconnect();
      }
    }, 60000);
	}

	public saveAudioToDisk(audioBlob: any) {
  	saveAudio(audioBlob, this.audioFileName);
	}

	public unsetTimer() {
		clearInterval(this.minutesCounter);
		this.minutesCounter = undefined;
	}

	public appendDialog(newLine: string) {
    this.fullTranscription += newLine;
    console.log("transcriptionFileName: ", this.transcriptionFileName);
		fs.writeFile(this.transcriptionFileName, newLine, (err) => {
      if(err) {
        console.log("error while writing dialogue: ", err);
      }
      else {
        //
      }
    });
	}

	public saveCaptionsToDisk() {
		fs.writeFileSync(this.captionsFileName, JSON.stringify(this.displayTranscript, null, 2) , 'utf-8');
	}

	public async uploadFilesToS3 () {
		const filesToUpload = [
			{
				fileName: this.audioFileName,
				type: 'audio',
				key: 'audio.webm'
			},
			{
				fileName: this.transcriptionFileName,
				type: 'transcription',
				key: 'transcription.txt'
			},
			{
				fileName: this.captionsFileName,
				type: 'captions',
				key: 'captions.json'
			}
		]
    for(const fileToUpload of filesToUpload) {
  	  const fileName = fileToUpload.fileName;
  	  const key = fileToUpload.key;
    	fs.readFile(fileName, async (err, data) => {
        if (err) { throw err; }
        let params = { Bucket: NOTES_BUCKET, Key: `${this.user.userId}/${this.meetingNote.code}/${key}`, Body: data };
        await new AWS.S3().putObject(params, (err, data) => {
         if (err) {
           console.log(err)
         }
         else {
           console.log("Successfully uploaded data to myBucket/myKey");
         }
        });
      });
		}
	}

  public async indexToElastic() {
    const results = await axios.post(`${ELASTIC_SEARCH_HOST}/meetings/note/`, {
      userId: this.user.id,
      code: this.meetingNote.code,
      title: this.meetingNote.title,
      notes: this.fullTranscription,
      startTime: this.meetingNote.startTime
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  public flushCaptions() {
    this.captions = [];
  }

  public pushIntoCaptions(caption: any) {
    this.captions.push(caption);
  }

  public getCaptions() {
    return this.captions;
  }

  public async setMeetingEndTime() {
    this.meetingNote.endTime = new Date();
    await getRepository(MeetingNote).save(this.meetingNote);
  }

  public delFilesAndFolders() {
    rimraf.sync(`/var/meetdata/${this.user.userId}`);
  }

 	private setFileNames() {
		this.audioFileName = `/var/meetdata/${this.user.userId}/${this.meetingNote.code}/audio.webm`;
		this.transcriptionFileName = `/var/meetdata/${this.user.userId}/${this.meetingNote.code}/transcription.txt`;
		this.captionsFileName = `/var/meetdata/${this.user.userId}/${this.meetingNote.code}/captions.json`;
	}
}