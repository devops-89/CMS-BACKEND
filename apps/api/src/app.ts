import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import dotenv from "dotenv";
import cors from "cors";
const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));


dotenv.config();
app.use(express.json());



app.use("/api/auth",authRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Contest Management API running 🚀");
});



export default app;