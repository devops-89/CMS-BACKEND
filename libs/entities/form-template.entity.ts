import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { FormSubmission } from "./form-submission.entity";



export type FieldConfig = {
  defaultCountry?: string;
  onlyCountries?: string[];
  disablePast?: boolean;
  disableFuture?: boolean;
  min?: number;
  max?: number;
};

export type FormField={
    id:string;
    type:string;
    label:string;
    required?:boolean;
    variant?:string;
    options?:string[];
    config?: FieldConfig;
}

export type FormIdentity={
    name:string;
    title:string;
    timestamp:string;
}

export type FormSchema={
    form_identity:FormIdentity;
    fields:FormField[];
}


@Entity("form_templates")
export class FormTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "jsonb" })
  schema!: FormSchema;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 1 })
  version!: number;

  // Relation with Submissions
  @OneToMany(() => FormSubmission, (submission) => submission.template)
  submissions!: FormSubmission[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
