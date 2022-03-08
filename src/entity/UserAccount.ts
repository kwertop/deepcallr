import { 
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Check
} from "typeorm";

@Entity()
export class UserAccount {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, default: "" })
  userId: string;

  @Column({ nullable: false, default: "" })
  profilePic: string;

  @Column()
  token: string;

  @Column({ nullable: false, select: false })
  password: string;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;
}
