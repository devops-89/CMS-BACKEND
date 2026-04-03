import { Router } from "express";
import { ContestJudgeController } from "./judge.controller";

const router = Router({ mergeParams: true });
const controller = new ContestJudgeController();

router.get("/", controller.getAll.bind(controller));
router.post("/", controller.assign.bind(controller));
router.patch("/:jid/status", controller.updateStatus.bind(controller));
router.delete("/:jid", controller.remove.bind(controller));

export default router;