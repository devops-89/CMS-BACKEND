import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

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
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: PERMISSION_ROLE,
  })
  role!: PERMISSION_ROLE;

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
}