import { Router } from "express";
import { EmailTemplateController } from "./email-template.controller";
import { validate } from "@libs/middlewares/validate.middleware";
import {
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
  emailTemplateIdParamSchema,
} from "@libs/dto/email-template.dto";

const router = Router({ mergeParams: true });
const controller = new EmailTemplateController();

// GET    /:contestId/email-templates        — list all templates for a contest
router.get("/", controller.getAll.bind(controller));

// POST   /:contestId/email-templates        — create a new template
router.post(
  "/",
  validate(createEmailTemplateSchema, "body"),
  controller.create.bind(controller)
);

// GET    /:contestId/email-templates/:templateId   — get single template
router.get(
  "/:templateId",
  validate(emailTemplateIdParamSchema, "params"),
  controller.getById.bind(controller)
);

// PUT    /:contestId/email-templates/:templateId   — update template
router.put(
  "/:templateId",
  validate(emailTemplateIdParamSchema, "params"),
  validate(updateEmailTemplateSchema, "body"),
  controller.update.bind(controller)
);

// DELETE /:contestId/email-templates/:templateId   — delete template
router.delete(
  "/:templateId",
  validate(emailTemplateIdParamSchema, "params"),
  controller.delete.bind(controller)
);

export default router;
