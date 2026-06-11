import { Router } from "express";
import { ContestController } from "./contest.controller";
import { authorize } from "@libs/middlewares/role.middleware";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { UserRole } from "@libs/entities";

const router = Router();
const controller = new ContestController();

router.get("/", controller.getAll.bind(controller));
router.post("/", authenticate, authorize(UserRole.ADMIN), controller.createContest.bind(controller));

router.get("/voting-period/:votingPeriodId", controller.getVotingPeriodDetail.bind(controller));
router.put("/voting-period/:votingPeriodId", controller.updateVotingPeriod.bind(controller));

router.get("/:id", controller.getOverview.bind(controller));
router.put("/:id", controller.update.bind(controller));
router.patch("/:id/status", controller.updateStatus.bind(controller));
router.delete("/:id", controller.delete.bind(controller));
router.get("/:id/voting-period", controller.getVotingPeriods.bind(controller));
router.post("/:id/voting-period", controller.createVotingPeriod.bind(controller));

export default router;