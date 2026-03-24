import "reflect-metadata";
import { DataSource } from "typeorm";
import {User,RefreshToken,Otp, ParticipantProfile, JudgeProfile,AdminProfile,FormTemplate, FormSubmission} from "../entities";


export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "admin",
  password: process.env.DB_PASSWORD || "launchpad@123",
  database: process.env.DB_NAME || "launchpad_db",
  synchronize: false,
  entities: [User,RefreshToken,Otp, ParticipantProfile, JudgeProfile,AdminProfile, FormTemplate, FormSubmission],
  migrations: ["libs/database/migrations/*.ts"],
});