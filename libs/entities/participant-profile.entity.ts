// libs/entities/participant-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";


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

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}