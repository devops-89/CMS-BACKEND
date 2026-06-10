import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

import { VotingPeriod } from "./voting-period";
import { User } from "./user.entity";

@Entity("judge_assigned_voting_periods")
export class JudgeAssignedVotingPeriod {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Voting Period Relation
  @ManyToOne(() => VotingPeriod, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "voting_period_id" })
  votingPeriod!: VotingPeriod;

  @Column()
  @Index()
  voting_period_id!: string;

  // Judge(User) Relation
  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "judge_id" })
  judge!: User;

  @Column()
  @Index()
  judge_id!: string;

  @CreateDateColumn()
  created_at!: Date;
}