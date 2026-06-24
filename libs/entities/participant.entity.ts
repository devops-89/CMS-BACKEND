import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, OneToOne,
  OneToMany, JoinColumn, Index,
  Unique,
} from "typeorm";

import { Entry, FormSubmission, Contest, User, Vote } from "@libs/entities";

@Entity("participants")
@Unique("UQ_participant_contest_user", [
  "contest_id",
  "user_id",
])
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

  @OneToMany(() => Vote, (vote) => vote.participant)
votes!: Vote[];

  @Column()
  submission_id!: string;

  @ManyToOne(() => User, (u) => u.participants, {
    onDelete: 'SET NULL',
    nullable: true,
  })

  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ nullable: true })
  @Index()
  user_id?: string;


  @Column({
    type: "enum",
    enum: ["pending", "approved", "banned", "rejected", "semi-finalist", "finalist", "winner"],
    default: "pending",
  })
  status!: "pending" | "approved" | "banned" | "rejected" | "semi-finalist" | "finalist" | "winner";

  @OneToMany(() => Entry, (e) => e.participant)
  entries!: Entry[];

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

  @CreateDateColumn()
  joined_at!: Date;
}