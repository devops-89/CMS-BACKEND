import { Router } from "express";
import { VoteController } from "./vote.controller";

const router = Router({ mergeParams: true });
const controller = new VoteController();

router.get("/", controller.getAll.bind(controller));
router.post("/", controller.cast.bind(controller));
router.delete("/:vid", controller.delete.bind(controller));

export default router;