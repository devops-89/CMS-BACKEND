import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import dotenv from "dotenv";
const app = express();


dotenv.config();
app.use(express.json());



app.use("/api/auth",authRoutes);
app.use("/api/user", userRoutes);

app.get("/", (req, res) => {
  res.send("Contest Management API running 🚀");
});



export default app;