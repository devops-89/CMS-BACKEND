import express from "express";
import cors from "cors";
import userRoutes from "./user.routes";

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "user-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/", userRoutes);



export default app;