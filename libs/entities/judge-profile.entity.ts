import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, OneToMany, JoinColumn, CreateDateColumn,
} from "typeorm";

import {User, ContestJudge} from "@libs/entities";



@Entity("judge_profiles")
export class JudgeProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // OneToOne with User — judge's account
  @OneToOne(() => User, (user) => user.judgeProfile, { onDelete: "CASCADE" })
  @JoinColumn()
  user!: User;

  // expertise areas e.g. ["AI", "Robotics", "ML"]
  @Column({ type: "simple-array", nullable: true, default: null })
  expertise!: string[] | null;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "int", default: 0 })
  totalEvaluations!: number;

  // one judge → many contest assignments
  @OneToMany(() => ContestJudge, (cj) => cj.judgeProfile)
  contestAssignments!: ContestJudge[];

  @CreateDateColumn()
  createdAt!: Date;
}