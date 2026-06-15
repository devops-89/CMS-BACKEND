import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, } from 'typeorm'
import { User } from './user.entity';

@Entity('countries')
@Index(['code'], { unique: true }) // ISO code unique
@Index(['name'], { unique: true }) // Avoid duplicate country names

export class Country {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 100 })
    name!: string; // India, United States

    @Column({ type: 'varchar', length: 10 })
    code!: string; // IN, US, UK

    @Column({ type: 'varchar', length: 10, nullable: true })
    phoneCode?: string; // +91, +1

    @Column({ type: 'varchar', length: 10, nullable: true })
    currencyCode?: string; // INR, USD

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @OneToMany(() => User, user => user.country, { cascade: true })
    users?: User[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
