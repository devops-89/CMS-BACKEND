// libs/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { AdminProfile } from "./admin-profile.entity";
import { JudgeProfile } from "./judge-profile.entity";
import { ParticipantProfile } from "./participant-profile.entity";
import { Participant } from "./participant.entity";
import { EntryAssignment } from "./entry-assignment.entity";
import { FormTemplate } from "./form-template.entity";
import { Contest } from "./contest.entity";
import { Country } from "./country.entity";

export enum UserRole {
  ADMIN = "admin",
  JUDGE = "judge",
  PARTICIPANT = "participant",
  MODERATOR = "moderator",
}

export enum UserStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  SUSPENDED = "Suspended",
  PENDING = "Pending",
  BANNED = "Banned",
  REJECTED = "Rejected",
  UPCOMING = "Upcoming",
  COMPLETED = "Completed",
  OFFLINE = "Offline",
  PUBLISHED = "Published",
  DRAFT = "Draft",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  fullName?: string;

  @Column({ nullable: true })
countryId?: string;

@ManyToOne(() => Country, (country) => country.users, {
  nullable: true,
  onDelete: "SET NULL",
})
@JoinColumn({ name: "countryId" })
country?: Country;

  @Column({ nullable: true })
  phone?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ select: false, nullable: true })
  password?: string;

  @Column({
    type: "enum",
    enum: UserRole,
  })
  role!: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  // Relations
  @OneToOne(() => AdminProfile, (admin) => admin.user)
  adminProfile?: AdminProfile;

  @OneToOne(() => JudgeProfile, (judge) => judge.user)
  judgeProfile?: JudgeProfile;

  @OneToOne(() => ParticipantProfile, (participant) => participant.user)
  participantProfile?: ParticipantProfile;

  @OneToMany(() => Participant, (participant) => participant.user)
  participants?: Participant[];

  @OneToMany(
    () => EntryAssignment,
    (assignment) => assignment.judge,
  )
  entryAssignments!: EntryAssignment[];

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {},
  })
  participant_profile_data?: Record<string, any>;

  // Relation
@ManyToOne(
  () => FormTemplate,
  (formTemplate) => formTemplate.users,
  {
    nullable: true,
    onDelete: "SET NULL",
  },
)
@JoinColumn({ name: "form_template_id" })
formTemplate?: FormTemplate;

@Column({ nullable: true })
form_template_id?: string;

@Column({
  type: "boolean",
  nullable: true,
  default: null,
})
isSelfRegistered?: boolean | null;

@OneToMany(() => Contest, (contest) => contest.createdBy)
createdContests?: Contest[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @DeleteDateColumn()
  deleted_at!: Date;


}
