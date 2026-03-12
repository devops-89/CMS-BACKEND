// libs/entities/judge-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class JudgeProfile {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToOne(() => User, (user) => user.judgeProfile)
  @JoinColumn()
  user!: User;

  @Column({nullable:true})
  fullName!:string;

  @Column({nullable:true})
  phone!:string;

  @Column({ nullable: true })
  judgeLicense?: string; // example judge-specific field

  @Column({nullable:true})
  specialization?:string;

  @Column({default:true})
  isActive!:boolean;

  @Column({type:"int",default:0})
  totalEvaluations!:number;

  @Column({type:"timestamp",default:()=> "CURRENT_TIMESTAMP"})
  createdAt!:Date;

}