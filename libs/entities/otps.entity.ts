import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";

export enum OtpType {
  PASSWORD_RESET = "PASSWORD_RESET"
}

@Entity("otps")
export class Otp {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  user_id!: string;

  @Column("text")
  otp!: string; // 🔐 hashed OTP

  @Column({
    type: "enum",
    enum: OtpType,
    default: OtpType.PASSWORD_RESET
  })
  type!: OtpType; 

  @Column()
  expires_at!: Date;

  @Column({ default: false })
  isUsed!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}