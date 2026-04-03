import express from "express";
import cors from "cors";
import contestRoutes from "./contest.routes";

const app = express();


app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "contest-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/", contestRoutes);

export default app;