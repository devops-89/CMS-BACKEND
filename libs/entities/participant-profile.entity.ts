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


  @Column({nullable:true})
  fullName!:string;

  @Column({nullable:true})
  phone!:string;

  @Column({nullable:true})
  country!:string;

  @Column({nullable:true})
  organization!:string;

  @Column({nullable:true})
  category!:string;

  @Column({default:false})
  isSubmitted!:boolean;

  @Column({default:false})
  isApproved!:boolean;

//   @ManyToOne(() => Contest)
//   contest: Contest;

  @Column({ type:"float", default:0})
  score!:number;

  @Column({nullable:true})
  submissionTitle!:string;

  @Column({nullable:true})
  submissionFile!:string;

  @Column({type:"timestamp", default:()=> "CURRENT_TIMESTAMP"  })
  createdAt!:Date;

  
}