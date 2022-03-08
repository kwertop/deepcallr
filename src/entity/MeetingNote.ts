import { 
  Column,
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  getRepository,
  Repository
} from "typeorm";
import { generateRandomCode } from "../utils/commonUtil";

@Entity()
export class MeetingNote {

  @PrimaryColumn("bigint", { generated: true })
  id: number;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: false })
  title: string;

  @Column("int", { nullable: false })
  userId: number;

  @Column()
  recordingLink: string;

  @Column({ nullable: false })
  transcriptionLink: string;

  @Column()
  summaryLink: string;

  @Column("int", { nullable: false })
  via: MeetingApp;

  @Column({ nullable: false })
  viaMeetingCode: string;

  @Column({ type: "timestamp" })
  startTime: Date;

  @Column({ type: "timestamp" })
  endTime: Date;

  @Column({ default: false })
  active: boolean;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;
}

export enum MeetingApp {
  GoogleMeet = 1,
  Zoom = 2,
  Teams = 3,
  Webex = 4,
  BlueJeans = 5,
  JioMeet = 6,
  Others = 7
}

export const createMeetingNote = async (userId: number, title: string, via: string, viaMeetingCode: string) => {
  let meetingRepo: Repository<MeetingNote> = getRepository(MeetingNote);
  let code: string;
  let existingMeeting: MeetingNote;
  do {
    code = generateRandomCode();
    existingMeeting = await meetingRepo.findOne({ code: code });
  } while(existingMeeting);
  let meetingNote: MeetingNote = new MeetingNote();
  meetingNote.code = code;
  meetingNote.userId = userId;
  meetingNote.title = title;
  meetingNote.via = getMeetingApp(via);
  meetingNote.startTime = new Date();
  meetingNote.viaMeetingCode = viaMeetingCode;
  return await meetingRepo.save(meetingNote);
}

const getMeetingApp = (via: string): MeetingApp => {
  switch(via) {
    case 'GoogleMeet':
      return MeetingApp.GoogleMeet;
    case 'Zoom':
      return MeetingApp.Zoom;
    case 'Teams':
      return MeetingApp.Teams;
    case 'Webex':
      return MeetingApp.Webex;
    case 'BlueJeans':
      return MeetingApp.BlueJeans;
    case 'JioMeet':
      return MeetingApp.JioMeet;
    default:
      return MeetingApp.Others;
  }
}
