import { 
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check
} from "typeorm";

@Entity()
@Check(`"price" > 0`)
@Check(`"price_per_year" > 0`)
export class Plan {

  @PrimaryGeneratedColumn()
  id: number;

  @Column("decimal", { precision: 18, scale: 2, nullable: false })
  price: number;

  @Column("int", { nullable: false })
  minutesPerMonth: number;

  @Column("decimal", { precision: 18, scale: 2, nullable: false })
  originalPrice: number;

  @Column("decimal", { precision: 18, scale: 2, nullable: false })
  pricePerYear: number;

  @Column("text", { array: true })
  features: string[];

  @Column({ default: false })
  visibleOnWeb: boolean;

  @Column({ default: false })
  active: boolean;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;
}
