// libs/entities/admin-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { nullable } from "zod";

@Entity()
export class AdminProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User, (user) => user.adminProfile,{
    onDelete:"CASCADE"
  })
  @JoinColumn()
  user!: User;

  @Column({nullable:true})
  fullName!:string;

  @Column({nullable:true})
  phone!:string;

  @Column({ nullable: true })
  adminCode!: string; // example admin-specific field

  @Column({default:true})
  isActive!:boolean;

  @Column({nullable:true})
  department!:string;

  @Column({type:"timestamp", default:()=>"CURRENT_TIMESTAMP"})
  createdAt!:Date;




}