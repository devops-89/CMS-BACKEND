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
  DeleteDateColumn,
} from "typeorm";

import { Contest } from "./contest.entity";

export enum TEMPLATE_AUDIENCE {
  PARTICIPANT = "participant",
  JUDGE = "judge",
}

export enum TEMPLATE_EVENT_TYPE {
  REGISTRATION_SUCCESSFUL = "registration_successful",
  ENTRY_SUBMITTED = "entry_submitted",
  SELECTED_AS_SEMI_FINALIST = "selected_as_semi_finalist",
  SELECTED_AS_FINALIST = "selected_as_finalist",
  ANNOUNCED_AS_WINNER = "announced_as_winner",
  ASSIGNED_AS_JUDGE = "assigned_as_judge",
}

@Entity("email_templates")
@Unique("UQ_contest_audience_event", [
  "contest_id",
  "audience",
  "event_type",
])
export class EmailTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Contest, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contest_id" })
  contest!: Contest;

  @Column({
    type: "uuid",
  })
  @Index()
  contest_id!: string;

  @Column({
    type: "enum",
    enum: TEMPLATE_AUDIENCE,
  })
  audience!: TEMPLATE_AUDIENCE;

  @Column({
    type: "enum",
    enum: TEMPLATE_EVENT_TYPE,
  })
  event_type!: TEMPLATE_EVENT_TYPE;

  @Column({
    type: "varchar",
    length: 255,
  })
  subject!: string;

  @Column({
    type: "text",
  })
  body!: string;

  @Column({
  type: "jsonb",
  nullable: true,
  default: () => "'[]'",
})
available_variables!: string[];

  @Column({
    type: "boolean",
    default: true,
  })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;
}