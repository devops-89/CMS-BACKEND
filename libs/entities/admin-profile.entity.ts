// libs/entities/admin-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class AdminProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (user) => user.adminProfile)
  @JoinColumn()
  user!: User;

  @Column({ nullable: true })
  adminCode!: string; // example admin-specific field
}