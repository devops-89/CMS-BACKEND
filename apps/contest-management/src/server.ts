import app from "./app";
import { AppDataSource } from "@libs/database/data-source";
const PORT = 5004;

  AppDataSource.initialize()
  .then(() => {
    console.log(" Database connected To Contest Management Service.");


    app.listen(PORT, () => {
      console.log(`🚀 contest-management service running on ${PORT}`);
    });

  })
  .catch((err) => {
    console.error(" DB connection failed:", err);
  });