import { Router } from "express";
import { EntryController } from "./entry.controller";

const router = Router({ mergeParams: true });
const controller = new EntryController();

router.get("/", controller.getAll.bind(controller));
router.post("/", controller.create.bind(controller));
router.get("/:eid", controller.getOne.bind(controller));
router.patch("/:eid/status", controller.updateStatus.bind(controller));
router.patch("/:eid", controller.update.bind(controller));
router.delete("/:eid", controller.delete.bind(controller));

export default router;