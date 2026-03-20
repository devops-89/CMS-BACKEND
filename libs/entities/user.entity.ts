// libs/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { AdminProfile } from "./admin-profile.entity";
import { JudgeProfile } from "./judge-profile.entity";
import { ParticipantProfile } from "./participant-profile.entity";

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

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  phone!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

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
}
