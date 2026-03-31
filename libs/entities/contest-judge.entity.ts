import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from "typeorm";
import { Contest } from "./contest.entity";
import { JudgeProfile } from "./judge-profile.entity";

@Entity("contest_judges")
export class ContestJudge {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // many assignments → one contest
  @ManyToOne(() => Contest, (c) => c.judges, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contest_id" })
  contest!: Contest;

  @Column({ type: "varchar" })
  @Index()
  contest_id!: string;

  // many assignments → one judge profile
  @ManyToOne(() => JudgeProfile, (jp) => jp.contestAssignments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "judge_profile_id" })
  judgeProfile!: JudgeProfile;

  @Column({ type: "varchar" })
  @Index()
  judge_profile_id!: string;

  @Column({
    type: "enum",
    enum: ["active", "inactive"],
    default: "active",
  })
  status!: "active" | "inactive";

  @CreateDateColumn()
  assigned_at!: Date;
}