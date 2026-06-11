import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index
} from "typeorm";
import { Entry } from "./entry.entity";
import { User } from "./user.entity";
import { Contest } from "./contest.entity";
import { VotingPeriod } from "./voting-period";

@Entity("judge_evaluations")
export class JudgeEvaluation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Entry, { onDelete: "CASCADE" })
  @JoinColumn({ name: "entry_id" })
  entry!: Entry;

  @Column({ type: "uuid" })
  @Index()
  entry_id!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "judge_id" })
  judge!: User;

  @Column({ type: "uuid" })
  @Index()
  judge_id!: string;

  @ManyToOne(() => Contest, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contest_id" })
  contest!: Contest;

  @Column({ type: "uuid" })
  @Index()
  contest_id!: string;

  @ManyToOne(() => VotingPeriod, { onDelete: "CASCADE" })
  @JoinColumn({ name: "voting_period_id" })
  votingPeriod!: VotingPeriod;

  @Column({ type: "uuid" })
  @Index()
  voting_period_id!: string;

  @Column({
    type: "jsonb",
    default: [],
  })
  scores!: { description: string; score: number; weighting: number }[];

  @Column({ type: "float" })
  total_score!: number;

  @Column({ type: "int", nullable: true, default: null })
  max_score!: number | null;

  @Column({ type: "text", nullable: true, default: null })
  feedback!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
