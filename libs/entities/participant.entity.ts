import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToOne,
  OneToMany, JoinColumn, Index,
} from "typeorm";

import {Entry, FormSubmission,Contest } from "@libs/entities";

@Entity("participants")
export class Participant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Contest, (c) => c.participants, { onDelete: "CASCADE" })
  @JoinColumn({ name: "contest_id" })
  contest!: Contest;

  @Column()
  @Index()
  contest_id!: string;

  // all participant data (name, email, phone etc) lives here
  @OneToOne(() => FormSubmission, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "submission_id" })
  submission!: FormSubmission;

  @Column()
  submission_id!: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status!: "pending" | "approved" | "rejected";

  @OneToMany(() => Entry, (e) => e.participant)
  entries!: Entry[];

  @CreateDateColumn()
  joined_at!: Date;
}