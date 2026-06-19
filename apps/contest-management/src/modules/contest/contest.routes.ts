import { Router } from "express";
import { ContestController } from "./contest.controller";
import { authorize } from "@libs/middlewares/role.middleware";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { validate } from "@libs/middlewares/validate.middleware";
import { UserRole } from "@libs/entities";
import { createContestSchema, updateContestSchema, updateContestStatusSchema, contestIdParamSchema, bulkUpdateEntriesStatusSchema } from "@libs/dto/contest.dto";

const router = Router();
const controller = new ContestController();

router.get("/", controller.getAll.bind(controller));
router.post("/", authenticate, authorize(UserRole.ADMIN), validate(createContestSchema, "body"), controller.createContest.bind(controller));
router.patch("/:id/entries/bulk-status", authenticate, authorize(UserRole.ADMIN), validate(contestIdParamSchema, "params"), validate(bulkUpdateEntriesStatusSchema, "body"), controller.bulkUpdateEntriesStatus.bind(controller));

router.get("/voting-period/:votingPeriodId", controller.getVotingPeriodDetail.bind(controller));
router.put("/voting-period/:votingPeriodId", controller.updateVotingPeriod.bind(controller));

router.get("/:id", validate(contestIdParamSchema, "params"), controller.getOverview.bind(controller));
router.put("/:id", validate(contestIdParamSchema, "params"), validate(updateContestSchema, "body"), controller.update.bind(controller));
router.patch("/:id/status", validate(contestIdParamSchema, "params"), validate(updateContestStatusSchema, "body"), controller.updateStatus.bind(controller));
router.delete("/:id", validate(contestIdParamSchema, "params"), controller.delete.bind(controller));
router.get("/:id/voting-period", validate(contestIdParamSchema, "params"), controller.getVotingPeriods.bind(controller));
router.post("/:id/voting-period", validate(contestIdParamSchema, "params"), controller.createVotingPeriod.bind(controller));

export default router;