import { Router } from "express";
import { ParticipantController } from "./participant.controller";
import multer from "multer";

// mergeParams lets us access :contestId from parent router
const router = Router({ mergeParams: true });
const controller = new ParticipantController();
const upload = multer();

router.get("/", controller.getAll.bind(controller));
router.post("/", upload.any(), controller.add.bind(controller));
router.get("/:pid", controller.getOne.bind(controller));
router.patch("/:pid/status", controller.updateStatus.bind(controller));
router.patch("/:pid", upload.any(), controller.update.bind(controller));
router.delete("/:pid", controller.remove.bind(controller));

export default router;