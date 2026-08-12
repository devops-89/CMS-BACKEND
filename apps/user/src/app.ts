import express from "express";
import cors from "cors";
import userRoutes from "./user.routes";
import countryRoutes from "./modules/country/country.routes";
import permissionRoutes from "./modules/permissions/permission.routes";

const app = express();



app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "user-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use("/countries", countryRoutes);
app.use("/permissions", permissionRoutes);
app.use("/", userRoutes);



export default app;