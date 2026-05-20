// libs/entities/participant-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { FormSubmission } from "./form-submission.entity";


@Entity("participant_profiles")
export class ParticipantProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User, (user) => user.participantProfile, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  user!: User;

  @Column()
  dateOfBirth!: Date;

  @Column()
  country!: string;

  @Column()
  schoolName!: string; // school name

  @Column()
  grade!: string; // grade

  @OneToOne(() => FormSubmission, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "submission_id" })
  submission?: FormSubmission;

  @Column({ nullable: true })
  submission_id?: string;

  @CreateDateColumn()
  createdAt!: Date;
}