import express from "express";
import cors from "cors";
import authRoutes from "./auth.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Auth Service 🚀");
});

export default app;