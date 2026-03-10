import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";

@Entity("password_reset_tokens")
export class PasswordResetToken {

  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  user_id!: string;

  @Column("text")
  token!: string;

  @Column()
  expires_at!: Date;

  @Column({ default: false })
  used!: boolean;
}