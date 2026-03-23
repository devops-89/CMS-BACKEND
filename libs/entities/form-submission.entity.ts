import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from "typeorm";
import { FormTemplate } from "./form-template.entity";

// strong typing for submitted data
export type FormData= Record<string,any>;

@Entity("form_submissions")
export class FormSubmission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Link To Template
  @ManyToOne(() => FormTemplate, (template) => template.submissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "template_id" })
  @Index() // improves query performance
  template!: FormTemplate;

  // store user submited form data
  @Column({ type: "jsonb" })
  data!: FormData;

  @CreateDateColumn()
  createdAt!: Date;
}
