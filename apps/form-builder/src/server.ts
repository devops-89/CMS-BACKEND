import app from "./app";
import { AppDataSource } from "@libs/database/data-source";
import dotenv from "dotenv";

dotenv.config();

const PORT = 5003;

  AppDataSource.initialize()
  .then(() => {
    console.log(" Database connected To Users Service.");


    app.listen(PORT, () => {
      console.log(`🚀 Form-Builder service running on ${PORT}`);
    });

  })
  .catch((err) => {
    console.error(" DB connection failed:", err);
  });