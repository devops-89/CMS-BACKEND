// libs/entities/judge-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class JudgeProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (user) => user.judgeProfile)
  @JoinColumn()
  user!: User;

  @Column({ nullable: true })
  judgeLicense?: string; // example judge-specific field
}