import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index,
} from "typeorm";
import { Entry } from "./entry.entity";

@Entity("votes")
export class Vote {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Entry, (e) => e.votes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "entry_id" })
  entry!: Entry;

  @Column({ type: "varchar" })
  @Index()
  entry_id!: string;

  @Column({ type: "varchar" })
  vote_email!: string;

  @Column({ type: "varchar", nullable: true, default: null })
  user_email!: string | null;

  @Column({ type: "varchar", nullable: true, default: null })
  schedule_name!: string | null;

  @Column({ type: "int", default: 1 })
  vote_count!: number;

  @Column({
    type: "enum",
    enum: ["paid", "unpaid"],
    default: "unpaid",
  })
  payment_status!: "paid" | "unpaid";

  @Column({ type: "float", nullable: true, default: null })
  judge_score!: number | null;

  @Column({ type: "varchar", nullable: true, default: null })
  ip_address!: string | null;

  @Column({ type: "varchar", nullable: true, default: null })
  session_id!: string | null;

  @Column({ type: "varchar", nullable: true, default: null })
  fingerprint!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}