import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";

import { Entry } from "./entry.entity";
import { Contest } from "./contest.entity";
import { Participant } from "./participant.entity";
import { User } from "./user.entity";

@Entity("votes")
@Unique("UQ_vote_per_user_per_entry_per_contest", [
  "user_id",
  "contest_id",
  "entry_id",
])
@Unique("UQ_vote_per_email_per_entry_per_contest", [
  "voter_email",
  "contest_id",
  "entry_id",
])
export class Vote {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Entry, (entry) => entry.votes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "entry_id" })
  entry!: Entry;

  @Column()
  @Index()
  entry_id!: string;

  @ManyToOne(() => Contest, (contest) => contest.votes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contest_id" })
  contest!: Contest;

  @Column()
  @Index()
  contest_id!: string;

  @ManyToOne(() => Participant, (participant) => participant.votes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "participant_id" })
  participant!: Participant;

  @Column()
  @Index()
  participant_id!: string;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user?: User | null;

  @Column({
    type: "uuid",
    nullable: true,
  })
  @Index()
  user_id!: string | null;

  // Public voter details
  @Column({
    type: "varchar",
    length: 255,
  })
  voter_email!: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  voter_name!: string | null;

  // @Column({
  //   type: "enum",
  //   enum: ["paid", "unpaid"],
  //   default: "unpaid",
  // })
  // payment_status!: "paid" | "unpaid";

  // Judge score (optional)
  @Column({
    type: "float",
    nullable: true,
  })
  judge_score!: number | null;

  // Public comment
  @Column({
    type: "text",
    nullable: true,
  })
  comment!: string | null;

  @Column({
    type: "timestamp",
    nullable: true,
  })
  commentedAt!: Date | null;

  // Fraud prevention / tracking
  @Column({
    type: "varchar",
    nullable: true,
  })
  ip_address!: string | null;

  @Column({
    type: "varchar",
    nullable: true,
  })
  session_id!: string | null;

  @Column({
    type: "varchar",
    nullable: true,
  })
  fingerprint!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}





// import {
//   Entity, PrimaryGeneratedColumn, Column,
//   CreateDateColumn, ManyToOne, JoinColumn, Index,
//   Unique,
//   UpdateDateColumn,
// } from "typeorm";
// import { Entry } from "./entry.entity";
// import { Contest } from "./contest.entity";
// import { Participant } from "./participant.entity";
// import { User } from "./user.entity";

// @Entity("votes")
// @Unique("UQ_vote_per_user_per_entry_per_contest", [
//   "user_id",
//   "contest_id",
//   "entry_id",
// ])
// @Unique("UQ_vote_per_email_per_entry_per_contest", [
//   "voter_email",
//   "contest_id",
//   "entry_id",
// ])
// export class Vote {
//   @PrimaryGeneratedColumn("uuid")
//   id!: string;

//   @ManyToOne(() => Entry, (e) => e.votes, { onDelete: "CASCADE" })
//   @JoinColumn({ name: "entry_id" })
//   entry!: Entry;

//   @ManyToOne(() => Contest, { onDelete: "CASCADE" })
// @JoinColumn({ name: "contest_id" })
// contest!: Contest;

// @Column()
// @Index()
// contest_id!: string;

// @ManyToOne(() => Participant, {
//   onDelete: "CASCADE",
// })
// @JoinColumn({ name: "participant_id" })
// participant!: Participant;

// @Column()
// @Index()
// participant_id!: string;

// @ManyToOne(() => User, {
//   nullable: true,
//   onDelete: "CASCADE",
// })
// @JoinColumn({ name: "user_id" })
// user!: User;

// @Column({ nullable: true })
// @Index()
// user_id!: string | null;

//   @Column({ type: "varchar" })
//   @Index()
//   entry_id!: string;

//   @Column({ type: "varchar" })
//   voter_email!: string;

//   // @Column({ type: "varchar", nullable: true, default: null })
//   // user_email!: string | null;

//   // @Column({ type: "varchar", nullable: true, default: null })
//   // schedule_name!: string | null;

//   @Column({ type: "int", default: 1 })
//   vote_count!: number;

//   @Column({
//     type: "enum",
//     enum: ["paid", "unpaid"],
//     default: "unpaid",
//   })
//   payment_status!: "paid" | "unpaid";

//   @Column({ type: "float", nullable: true, default: null })
//   judge_score!: number | null;

//   @Column({ type: "varchar", nullable: true, default: null })
//   ip_address!: string | null;

//   @Column({ type: "varchar", nullable: true, default: null })
//   session_id!: string | null;

//   @Column({ type: "varchar", nullable: true, default: null })
//   fingerprint!: string | null;

//   @Column({
//     type: "text",
//     nullable: true,
//   })
//   comment!: string | null;

//   @Column({
//     type: "timestamp",
//     nullable: true,
//   })
//   commentedAt!: Date | null;

//   @CreateDateColumn()
//   created_at!: Date;

//   @UpdateDateColumn()
// updated_at!: Date;
// }