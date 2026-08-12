import app from "./app";
import { AppDataSource } from "@libs/database/data-source";

const PORT = 5001;

  AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected To Auth Service.");

    app.listen(PORT, () => {
      console.log(`🚀 Auth service running on ${PORT}`);
    });

  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });
