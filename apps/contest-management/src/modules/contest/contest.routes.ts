import { Router } from "express";
import { ContestController } from "./contest.controller";
import { authorize } from "@libs/middlewares/role.middleware";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { validate } from "@libs/middlewares/validate.middleware";
import { UserRole } from "@libs/entities";
import { createContestSchema, updateContestSchema, updateContestStatusSchema, contestIdParamSchema, bulkUpdateEntriesStatusSchema } from "@libs/dto/contest.dto";
import multer from "multer";

const router = Router();
const controller = new ContestController();
const upload = multer();

const parseContestMultipartData = (req: any, res: any, next: any) => {
  if (req.body) {
    let payload = { ...req.body };
    const rawData = req.body.data || req.body.formData;
    if (rawData) {
      if (typeof rawData === "string") {
        try {
          payload = JSON.parse(rawData);
        } catch (e) {}
      } else if (typeof rawData === "object" && rawData !== null) {
        payload = rawData;
      }
    }

    if (payload.available_countries && typeof payload.available_countries === "string") {
      try {
        payload.available_countries = JSON.parse(payload.available_countries);
      } catch (e) {}
    }
    if (payload.available_regions && typeof payload.available_regions === "string") {
      try {
        payload.available_regions = JSON.parse(payload.available_regions);
      } catch (e) {}
    }

    // Parse boolean strings to booleans
    const booleanKeys = ["public_visibility", "auto_moderate_entries", "allow_new_registrations"];
    for (const key of booleanKeys) {
      if (payload[key] === "true") payload[key] = true;
      if (payload[key] === "false") payload[key] = false;
    }

    req.body = payload;
  }
  next();
};

router.post("/cron/publish-status", controller.triggerPublishCron.bind(controller));
router.get("/", controller.getAll.bind(controller));
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  upload.any(),
  parseContestMultipartData,
  validate(createContestSchema, "body"),
  controller.createContest.bind(controller)
);
router.patch("/:id/entries/bulk-status", authenticate, authorize(UserRole.ADMIN), validate(contestIdParamSchema, "params"), validate(bulkUpdateEntriesStatusSchema, "body"), controller.bulkUpdateEntriesStatus.bind(controller));

router.get("/voting-period/:votingPeriodId", controller.getVotingPeriodDetail.bind(controller));
router.put("/voting-period/:votingPeriodId", controller.updateVotingPeriod.bind(controller));

router.get("/:id", validate(contestIdParamSchema, "params"), controller.getOverview.bind(controller));
router.put(
  "/:id",
  validate(contestIdParamSchema, "params"),
  upload.any(),
  parseContestMultipartData,
  validate(updateContestSchema, "body"),
  controller.update.bind(controller)
);
router.patch("/:id/status", validate(contestIdParamSchema, "params"), validate(updateContestStatusSchema, "body"), controller.updateStatus.bind(controller));
router.delete("/:id", validate(contestIdParamSchema, "params"), controller.delete.bind(controller));
router.get("/:id/voting-period", validate(contestIdParamSchema, "params"), controller.getVotingPeriods.bind(controller));
router.post("/:id/voting-period", validate(contestIdParamSchema, "params"), controller.createVotingPeriod.bind(controller));

export default router;