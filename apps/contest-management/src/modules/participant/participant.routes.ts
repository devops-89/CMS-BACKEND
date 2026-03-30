import { Router } from "express";
import { ParticipantController } from "./participant.controller";

// mergeParams lets us access :contestId from parent router
const router = Router({ mergeParams: true });
const controller = new ParticipantController();

router.get("/", controller.getAll.bind(controller));
router.post("/", controller.add.bind(controller));
router.get("/:pid", controller.getOne.bind(controller));
router.patch("/:pid/status", controller.updateStatus.bind(controller));
router.delete("/:pid", controller.remove.bind(controller));

export default router;