import { Router } from "express";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { authorize } from "@libs/middlewares/role.middleware";
const router=Router();
import { FormBuilderController } from "./form-builder.controller";
import { validate } from "@libs/middlewares/validate.middleware";
import { createTemplateSchema, submitFormSchema, templateIdParamSchema, templateParamSchema } from "@libs/dto/form-builder.dto";
const controller=new FormBuilderController();
import { User, UserRole } from "@libs/entities";


// Templates
router.post("/templates",authenticate,authorize(UserRole.ADMIN),validate(createTemplateSchema),controller.createTemplate.bind(controller));
router.get("/templates",authenticate,authorize(UserRole.ADMIN), controller.getTemplates.bind(controller));
router.get("/templates/:id",authenticate,authorize(UserRole.ADMIN),validate(templateParamSchema,"params"),controller.getTemplate.bind(controller));
router.put("/templates/:id",authenticate, authorize(UserRole.ADMIN) ,validate(templateParamSchema,"params"),validate(createTemplateSchema),controller.updateTemplate.bind(controller));
router.delete("/templates/:id",authenticate,authorize(UserRole.ADMIN), validate(templateParamSchema,"params"),controller.deleteTemplate.bind(controller));
router.post("/submit/:templateId",authenticate,authorize(UserRole.ADMIN),validate(templateIdParamSchema,"params"),validate(submitFormSchema),controller.submitForm.bind(controller));
router.get("/submissions/:templateId" ,authenticate,authorize(UserRole.ADMIN),validate(templateIdParamSchema, "params"),controller.getSubmissions.bind(controller));

export default router;