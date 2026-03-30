import { Router } from "express";
import { ContestController } from "./contest.controller";

const router = Router();
const controller = new ContestController();

router.get("/", controller.getAll.bind(controller));
router.post("/", controller.create.bind(controller));
router.get("/:id", controller.getOverview.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.patch("/:id/status", controller.updateStatus.bind(controller));
router.delete("/:id", controller.delete.bind(controller));

export default router;