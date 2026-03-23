import express from "express";
import cors from "cors";
import formBuildRoutes from "./form-builder.routes";

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "form-builder-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/", formBuildRoutes);



export default app;