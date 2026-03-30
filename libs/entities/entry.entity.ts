// entry.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from "typeorm";

import { Contest, Participant, Vote } from "@libs/entities";

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

  @Column({ type: "varchar" })
  title!: string;

  // explicitly tell TypeORM it's a nullable varchar — never let it infer from string | null
  @Column({ type: "varchar", nullable: true, default: null })
  thumbnail_url!: string | null;

  @Column({ type: "float", default: 0 })
  score!: number;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status!: "pending" | "approved" | "rejected";

  @OneToMany(() => Vote, (v) => v.entry)
  votes!: Vote[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}