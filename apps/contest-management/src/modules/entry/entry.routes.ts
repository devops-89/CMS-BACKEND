import { Router } from "express";
import { EntryController } from "./entry.controller";
import multer from "multer";

const router = Router({ mergeParams: true });
const controller = new EntryController();
const upload = multer();

router.get("/", controller.getAll.bind(controller));
router.post("/", upload.any(), controller.create.bind(controller));
router.get("/:eid", controller.getOne.bind(controller));
router.patch("/:eid/status", controller.updateStatus.bind(controller));
router.patch("/:eid", upload.any(), controller.update.bind(controller));
router.delete("/:eid", controller.delete.bind(controller));

export default router;