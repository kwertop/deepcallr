import { 
  Column,
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check
} from "typeorm";

@Entity()
export class Subscription {

  @PrimaryColumn("bigint", { generated: true })
  id: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  planId: number;

  @Column({ type: "timestamp" })
  validFrom: Date;

  @Column({ type: "timestamp" })
  validTo: Date;

  @Column("int", { nullable: false })
  minutesUsed: number;

  @Column("int", { nullable: false })
  status: SubscriptionStatus;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;
}

export enum SubscriptionStatus {
  Active = 1,
  Upcoming = 2,
  Expired = 3
}
