import { PrimaryGeneratedColumn,Column, Entity, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { FormSubmission } from "./form-submission.entity";


// string typing for schema
export type FormField={
        name:string;
        type:"text" | "email" | "number" | "select" | "checkbox" | "date";
        label?:string;
        required?:boolean;
        options?:string[];  // for select
}

export type FormSchema={
    fields: FormField[]
}

@Entity("form_templates")
export class FormTemplate{
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!:string;

    @Column({type:"jsonb"})
    schema!:FormSchema;

    @Column({default:true})
    isActive!:boolean;

    @Column({default:1})
    version!:number;

    // Relation with Submissions
    @OneToMany(()=> FormSubmission,(submission)=>submission.template)
    submissions!:FormSubmission[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;




}