import { Request, Response } from "express";
import { FormBuilderService } from "./form-builder.service";

const service = new FormBuilderService();

export class FormBuilderController {

  createTemplate = async (req: Request, res: Response) => {
    try {
      const data = await service.createTemplate(req.body);

      return res.json({
        message: "Template created successfully",
        data
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  getTemplates = async (_req: Request, res: Response) => {
    const data = await service.getTemplates();

    return res.json({
      message: "Templates fetched",
      data
    });
  };

getTemplate = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string; // ✅ FIX

    const data = await service.getTemplateById(id);

    return res.json({
      message: "Template fetched",
      data
    });
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

  submitForm = async (req: Request, res: Response) => {
  try {
    const templateId = req.params.templateId as string; // ✅ FIX

    const data = await service.submitForm(templateId, req.body);

    return res.json({
      message: "Form submitted successfully",
      data
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

  getSubmissions = async (req: Request, res: Response) => {
  const templateId = req.params.templateId as string; // ✅ FIX

  const data = await service.getSubmissions(templateId);

  return res.json({
    message: "Submissions fetched",
    data
  });
};
}