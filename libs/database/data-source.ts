import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  User,
  VotingPeriod,
  RefreshToken,
  EntryAssignment,
  Otp,
  ParticipantProfile,
  JudgeProfile,
  AdminProfile,
  FormTemplate,
  FormSubmission,
  Contest,
  Entry,
  Participant,
  Vote,
  ContestJudge,
  JudgeAssignedVotingPeriod,
  JudgeEvaluationHistory,
  JudgeEvaluation,
  Country,
} from "../entities";
import dotenv from "dotenv";

dotenv.config();


export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "launchpad_admin",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "launchpad_db",

  // Local development only
  synchronize: false,

  // SQL queries console lo chudali ante
  logging: false,

  entities: [
    User,
    RefreshToken,
    Otp,
    ParticipantProfile,
    JudgeProfile,
    AdminProfile,
    FormTemplate,
    ContestJudge,
    FormSubmission,
    Contest,
    Entry,
    Participant,
    Vote,
    VotingPeriod,
    EntryAssignment,
    JudgeAssignedVotingPeriod,
    JudgeEvaluation,
    JudgeEvaluationHistory,
    Country,
  ],

  migrations: ["libs/database/migrations/*.ts"],
});



// TODO: Before code no docker was used for database 
// import "reflect-metadata";
// import { DataSource } from "typeorm";
// import { User, VotingPeriod, RefreshToken, EntryAssignment, Otp, ParticipantProfile, JudgeProfile, AdminProfile, FormTemplate, FormSubmission, Contest, Entry, Participant, Vote, ContestJudge, JudgeAssignedVotingPeriod, JudgeEvaluationHistory, JudgeEvaluation, Country } from "../entities";


// export const AppDataSource = new DataSource({
//   type: "postgres",
//   host: process.env.DB_HOST || "db",
//   port: Number(process.env.DB_PORT) || 5432,
//   username: process.env.DB_USERNAME || "admin",
//   password: process.env.DB_PASSWORD || "launchpad@123",
//   database: process.env.DB_NAME || "launchpad_db",
//   synchronize: false,
//   entities: [
//     User,
//     RefreshToken,
//     Otp,
//     ParticipantProfile,
//     JudgeProfile,
//     AdminProfile,
//     FormTemplate,
//     ContestJudge,
//     FormSubmission,
//     Contest,
//     Entry,
//     Participant,
//     Vote,
//     VotingPeriod,
//     EntryAssignment,
//     JudgeAssignedVotingPeriod,
//     JudgeEvaluation,
//     JudgeEvaluationHistory,
//     Country
//   ],
//   migrations: ["libs/database/migrations/*.ts"],

//   //TODO: for particular migration files run we give like this
//   // migrations: ["libs/database/migrations/1779358859572-migration.ts"],

// });