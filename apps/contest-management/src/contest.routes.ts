import { Router } from "express";
import contestRoutes from "./modules/contest/contest.routes";
import participantRoutes from "./modules/participant/participant.routes";
import entryRoutes from "./modules/entry/entry.routes";
import voteRoutes from "./modules/vote/vote.routes";

const router = Router();

router.use("/", contestRoutes);
router.use("/:contestId/participants", participantRoutes);
router.use("/:contestId/entries", entryRoutes);
router.use("/:contestId/votes", voteRoutes);

export default router;