import { Router } from "express";
const router=Router();
import { FormBuilderController } from "./form-builder.controller";
import { validate } from "@libs/middlewares/validate.middleware";
import { createTemplateSchema, submitFormSchema, templateIdParamSchema, templateParamSchema } from "@libs/dto/form-builder.dto";
const controller=new FormBuilderController();


// Templates
router.post("/templates",validate(createTemplateSchema),controller.createTemplate.bind(controller));
router.get("/templates", controller.getTemplates.bind(controller));
router.get("/templates/:id",validate(templateParamSchema,"params"),controller.getTemplate.bind(controller));


router.post("/submit/:templateId",validate(templateIdParamSchema,"params"),validate(submitFormSchema),controller.submitForm.bind(controller));
router.get("/submissions/:templateId" ,validate(templateIdParamSchema, "params"),controller.getSubmissions.bind(controller));

export default router;