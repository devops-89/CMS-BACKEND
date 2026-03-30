import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from "typeorm";

import { FormTemplate, Entry, Participant } from "@libs/entities";




@Entity("contests")
export class Contest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "timestamp" })
  start_date!: Date;

  @Column({ type: "timestamp" })
  end_date!: Date;

  @Column({
    type: "enum",
    enum: ["draft", "published", "offline"],
    default: "draft",
  })
  status!: "draft" | "published" | "offline";

  @Column({ type: "simple-array", nullable: true })
  available_regions!: string[];

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

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}