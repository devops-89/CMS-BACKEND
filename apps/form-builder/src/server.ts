import app from "./app";
import { AppDataSource } from "@libs/database/data-source";
const PORT = 5003;

  AppDataSource.initialize()
  .then(() => {
    console.log(" Database connected To Users Service.");

    app.listen(PORT, () => {
      console.log(`🚀 Users service running on ${PORT}`);
    });

  })
  .catch((err) => {
    console.error(" DB connection failed:", err);
  });