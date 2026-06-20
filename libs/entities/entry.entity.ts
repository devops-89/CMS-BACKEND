import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, OneToOne,
  JoinColumn, Index,
} from "typeorm";

import { Contest, Participant, Vote, FormSubmission, User } from "@libs/entities";
import { EntryAssignment } from "./entry-assignment.entity";

@Entity("entries")
export class Entry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Contest, (c) => c.entries, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contest_id" })
  contest!: Contest;

  @Column()
  @Index()
  contest_id!: string;

  @ManyToOne(() => Participant, (p) => p.entries, { onDelete: "CASCADE" })
  @JoinColumn({ name: "participant_id" })
  participant!: Participant;

  @Column()
  participant_id!: string;


  @OneToOne(() => FormSubmission, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "submission_id" })
  submission!: FormSubmission;

  @Column()
  submission_id!: string;

  @Column({ type: "float", default: 0 })
  score!: number;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected", "draft", "evaluated", "semifinal", "final", "winner"],
    default: "pending",
  })
  status!: "pending" | "approved" | "rejected" | "draft" | "evaluated" | "semifinal" | "final" | "winner";

  @OneToMany(() => Vote, (v) => v.entry)
  votes!: Vote[];

  @Column({
  type: "timestamp",
  nullable: true,
})
draftedAt!: Date | null;

@Column({
  type: "boolean",
  default: false,
})
isDraft!: boolean;

@Column({
  type: "text",
  nullable: true,
})
rejectReason!: string | null;

@Column({
  type: "timestamp",
  nullable: true,
})
rejectedAt!: Date | null;

@Column({
  type: "timestamp",
  nullable: true,
})
evaluatedAt!: Date | null;

@Column({
  type: "timestamp",
  nullable: true,
})
semiFinalAt!: Date | null;

@Column({
  type: "timestamp",
  nullable: true,
})
finalAt!: Date | null;

@Column({
  type: "timestamp",
  nullable: true,
})
winnerAt!: Date | null;


  @OneToMany(
    () => EntryAssignment,
    (assignment) => assignment.entry,
  )
  entryAssignments!: EntryAssignment[];


  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}