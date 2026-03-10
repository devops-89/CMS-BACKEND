// libs/entities/participant-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from "typeorm";
import { User } from "./user.entity";
// import { Contest } from "./contest.entity";

@Entity()
export class ParticipantProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User, (user) => user.participantProfile)
  @JoinColumn()
  user!: User;

//   @ManyToOne(() => Contest)
//   contest: Contest;

  @Column({ nullable: true })
  score?: number;
}