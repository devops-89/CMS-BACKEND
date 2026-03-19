// libs/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { AdminProfile } from "./admin-profile.entity";
import { JudgeProfile } from "./judge-profile.entity";
import { ParticipantProfile } from "./participant-profile.entity";

export enum UserRole {
  ADMIN = "admin",
  JUDGE = "judge",
  PARTICIPANT = "participant",
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


  @Column({ type: "enum", enum: UserRole })
  role!: UserRole;

  // Relations
  @OneToOne(() => AdminProfile, (admin) => admin.user)
  adminProfile?: AdminProfile;

  @OneToOne(() => JudgeProfile, (judge) => judge.user)
  judgeProfile?: JudgeProfile;

  @OneToOne(() => ParticipantProfile, (participant) => participant.user)
  participantProfile?: ParticipantProfile;
}