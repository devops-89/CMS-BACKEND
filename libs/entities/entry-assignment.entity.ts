import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    DeleteDateColumn,
} from "typeorm";

import { Entry } from "./entry.entity";
import { Contest } from "./contest.entity";
import { User } from "./user.entity";

/**
 * REVIEW STATUS ENUM
 */
export enum EntryAssignmentStatus {
    PENDING = "pending",
    IN_REVIEW = "in_review",
    REVIEWED = "reviewed",
    REJECTED = "rejected",
}

@Entity("entry_assignments")
@Index(["contest_id", "judge_id", "entry_id"], {
    unique: true,
})
export class EntryAssignment {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    /**
     * CONTEST
     */
    @ManyToOne(() => Contest, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "contest_id" })
    contest!: Contest;

    @Column({ type: "uuid" })
    @Index()
    contest_id!: string;

    /**
     * JUDGE USER
     */
    @ManyToOne(() => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "judge_id" })
    judge!: User;

    @Column({ type: "uuid" })
    @Index()
    judge_id!: string;

    /**
     * ENTRY
     */
    @ManyToOne(() => Entry, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "entry_id" })
    entry!: Entry;

    @Column({ type: "uuid" })
    @Index()
    entry_id!: string;

    /**
     * REVIEW STATUS
     */
    @Column({
        type: "enum",
        enum: EntryAssignmentStatus,
        default: EntryAssignmentStatus.PENDING,
    })
    status!: EntryAssignmentStatus;

    /**
     * SCORE
     */
    @Column({
        type: "float",
        nullable: true,
        default: null,
    })
    score!: number | null;

    /**
     * FEEDBACK
     */
    @Column({
        type: "text",
        nullable: true,
        default: null,
    })
    feedback!: string | null;

    /**
     * REVIEWED AT
     */
    @Column({
        type: "timestamp",
        nullable: true,
        default: null,
    })
    reviewed_at!: Date | null;

    /**
     * ASSIGNED DATE
     */
    @CreateDateColumn()
    assigned_at!: Date;

    /**
     * UPDATED DATE
     */
    @UpdateDateColumn()
    updated_at!: Date;

    @DeleteDateColumn()
    deleted_at!: Date | null;
}