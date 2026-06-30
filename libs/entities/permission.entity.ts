import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from "typeorm";
import { Role } from "./role.entity";

export enum PERMISSION_ROLE {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  JUDGE = "JUDGE",
  PARTICIPANT = "PARTICIPANT",
  PUBLIC = "PUBLIC",
}

@Entity("permissions")
@Index(["role", "module"], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: PERMISSION_ROLE,
    nullable: true,
    default: PERMISSION_ROLE.PUBLIC,
  })
  role?: PERMISSION_ROLE | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "role_id" })
  roleEntity?: Role;

  @Column({ type: "uuid", nullable: true })
  role_id?: string;

  @Column({
    type: "varchar",
    length: 100,
  })
  module!: string;

  @Column({
    default: false,
  })
  canView!: boolean;

  @Column({
    default: false,
  })
  canCreate!: boolean;

  @Column({
    default: false,
  })
  canEdit!: boolean;

  @Column({
    default: false,
  })
  canDelete!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}