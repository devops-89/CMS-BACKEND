import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

import { Contest } from './contest.entity';

export enum VotingType {
    PUBLIC = 'PUBLIC',
    JUDGE = 'JUDGE',
    PAID = 'PAID',
}

@Entity('voting_periods')
export class VotingPeriod {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Contest Relation
    @ManyToOne(() => Contest, (contest) => contest.votingPeriods, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'contest_id' })
    contest!: Contest;

    @Column()
    @Index()
    contest_id!: string;

    // Voting Type
    @Column({
        type: 'enum',
        enum: VotingType,
    })
    voting_type!: VotingType;

    // Start Date
    @Column({
        type: 'timestamp',
    })
    start_date!: Date;

    // End Date
    @Column({
        type: 'timestamp',
    })
    end_date!: Date;

    // Status
    @Column({
        type: 'boolean',
        default: true,
    })
    is_active!: boolean;

    @Column({
        type: 'int',
        nullable: true,
        default: null,
    })
    max_score!: number | null;

    @Column({
        type: 'jsonb',
        nullable: true,
        default: null,
    })
    criteria!: { description: string; weighting: number }[] | null;

    @CreateDateColumn()
    created_at!: Date;
}