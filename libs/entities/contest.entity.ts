import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from "typeorm";
import { FormTemplate } from "./form-template.entity";
import { Entry } from "./entry.entity";
import { Participant } from "./participant.entity";
import { User } from "./user.entity";
import { ContestJudge } from "./contest-judge.entity";
import { VotingPeriod } from "./voting-period";
import { EntryAssignment } from "./entry-assignment.entity";

@Entity("contests")
export class Contest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: "text", nullable: true, default: null })
  description!: string | null;

  @Column({ type: "timestamp" })
  start_date!: Date;

  @Column({ type: "timestamp" })
  end_date!: Date;

  @Column({
    type: "enum",
    enum: ["Draft", "Published", "Offline"],
    default: "Draft",
  })
  status!: "Draft" | "Published" | "Offline";

  @Column({ type: "simple-array", nullable: true })
  available_regions!: string[];

  @Column({
  type: "text",
  array: true,
  nullable: true,
  default: () => "ARRAY[]::text[]",
})
available_countries?: string[];

  @ManyToOne(() => FormTemplate, { nullable: true, onDelete: "RESTRICT", eager: true })
  @JoinColumn({ name: "form_template_id" })
  formTemplate?: FormTemplate;

  @Column({ nullable: true })
  form_template_id?: string;

  @ManyToOne(() => FormTemplate, { nullable: true, onDelete: "RESTRICT", eager: true })
  @JoinColumn({ name: "entry_level_template_id" })
  entryLevelTemplate?: FormTemplate;

  @Column({ nullable: true })
  entry_level_template_id?: string;

  @ManyToOne(() => FormTemplate, { nullable: true, onDelete: "RESTRICT", eager: true })
  @JoinColumn({ name: "user_level_template_id" })
  userLevelTemplate?: FormTemplate;

  @Column({ nullable: true })
  user_level_template_id?: string;

  @OneToMany(() => Participant, (p) => p.contest)
  participants!: Participant[];

  @OneToMany(() => Entry, (e) => e.contest)
  entries!: Entry[];

  @OneToMany(() => ContestJudge, (cj) => cj.contest)
  judges!: ContestJudge[];

  @OneToMany(
    () => VotingPeriod,
    (votingPeriod) => votingPeriod.contest,
  )
  votingPeriods!: VotingPeriod[];

  @OneToMany(
    () => EntryAssignment,
    (assignment) => assignment.contest,
  )
  entryAssignments!: EntryAssignment[];

  @ManyToOne(() => User, {
  nullable: true,
  onDelete: "SET NULL",
  eager: false,
})
@JoinColumn({ name: "created_by" })
createdBy?: User;

@Column({ type: "uuid", nullable: true })
created_by?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}