import express from "express";
import cors from "cors";
import userRoutes from "./user.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Users Service 🚀");
});

export default app;