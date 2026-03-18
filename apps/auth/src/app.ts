import express from "express";
import cors from "cors";
import authRoutes from "./auth.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/", authRoutes);



export default app;