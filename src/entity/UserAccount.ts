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
import { BCRYPT_SALT_ROUNDS } from "../config";

const bcrypt = require('bcrypt');

@Entity()
@Check(`"email" <> ''`)
export class UserAccount {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  name: string;

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

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword() {
    if(this.password) {
      this.password = bcrypt.hashSync(this.password, BCRYPT_SALT_ROUNDS);
    }
  }
}
