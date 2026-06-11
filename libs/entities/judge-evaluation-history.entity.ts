import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn, Index
} from "typeorm";
import { JudgeEvaluation } from "./judge-evaluation.entity";

@Entity("judge_evaluation_histories")
export class JudgeEvaluationHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => JudgeEvaluation, { onDelete: "CASCADE" })
  @JoinColumn({ name: "evaluation_id" })
  evaluation!: JudgeEvaluation;

  @Column({ type: "uuid" })
  @Index()
  evaluation_id!: string;

  @Column({
    type: "jsonb",
    default: [],
  })
  scores!: { description: string; score: number; weighting: number }[];

  @Column({ type: "float" })
  total_score!: number;

  @Column({ type: "int", nullable: true, default: null })
  max_score!: number | null;

  @Column({ type: "text", nullable: true, default: null })
  feedback!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
