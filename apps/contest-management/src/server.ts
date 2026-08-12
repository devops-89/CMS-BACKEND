import app from "./app";
import { AppDataSource } from "@libs/database/data-source";
import dotenv from "dotenv";

dotenv.config();

const PORT = 5004;

  AppDataSource.initialize()
  .then(() => {
    console.log(" Database connected To Contest Management Service.");


    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Contest-Management service running on ${PORT}`);
    });

  })
  .catch((err) => {
    console.error(" DB connection failed:", err);
  });