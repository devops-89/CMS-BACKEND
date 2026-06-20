import { Router } from "express";
import { VoteController } from "./vote.controller";
import { authorize } from "@libs/middlewares/role.middleware";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { UserRole } from "@libs/entities";

const router = Router({ mergeParams: true });
const controller = new VoteController();

router.get("/", controller.getAll.bind(controller));
router.post("/:entryId", authenticate, authorize(UserRole.ADMIN,UserRole.JUDGE,UserRole.PARTICIPANT,UserRole.PUBLIC), controller.cast.bind(controller));
router.delete("/:vid", authenticate, authorize(UserRole.ADMIN), controller.delete.bind(controller));

export default router;