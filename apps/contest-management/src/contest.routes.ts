import { Router } from "express";
import contestRoutes from "./modules/contest/contest.routes";
import participantRoutes from "./modules/participant/participant.routes";
import entryRoutes from "./modules/entry/entry.routes";
import voteRoutes from "./modules/vote/vote.routes";
import judgeRoutes from "./modules/judge/judge.routes";
import emailTemplateRoutes from "./modules/email-template/email-template.routes";
import { ContestJudgeController } from "./modules/judge/judge.controller";
import { EntryController } from "./modules/entry/entry.controller";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { authorize } from "@libs/middlewares/role.middleware";
import { UserRole } from "@libs/entities";

const router = Router();
const judgeController = new ContestJudgeController();
const entryController = new EntryController();

router.get("/judges/my/entries", authenticate, authorize(UserRole.JUDGE), judgeController.getMyEntries.bind(judgeController));
router.post("/judges/my/entries/:entryId/evaluate", authenticate, authorize(UserRole.JUDGE), judgeController.evaluateEntry.bind(judgeController));
router.get("/judges/my/entries/:entryId/evaluation", authenticate, authorize(UserRole.JUDGE, UserRole.ADMIN, UserRole.PARTICIPANT), judgeController.getEvaluation.bind(judgeController));
router.put("/judges/my/entries/:entryId/evaluation", authenticate, authorize(UserRole.JUDGE), judgeController.updateEvaluation.bind(judgeController));

router.post("/entries/auto-approve-cron", authenticate, authorize(UserRole.ADMIN), entryController.triggerAutoApproveCron.bind(entryController));

router.use("/", contestRoutes);
router.use("/:contestId/entries", authenticate, authorize(UserRole.ADMIN, UserRole.JUDGE, UserRole.PARTICIPANT, UserRole.PUBLIC), entryRoutes);
router.use("/:contestId/votes", authenticate, authorize(UserRole.ADMIN, UserRole.JUDGE, UserRole.PUBLIC), voteRoutes);

router.use("/:contestId/participants", authenticate, authorize(UserRole.ADMIN), participantRoutes);
router.use("/:contestId/judges", authenticate, authorize(UserRole.ADMIN, UserRole.JUDGE), judgeRoutes);
router.use("/:contestId/email-templates", authenticate, authorize(UserRole.ADMIN), emailTemplateRoutes);

export default router;