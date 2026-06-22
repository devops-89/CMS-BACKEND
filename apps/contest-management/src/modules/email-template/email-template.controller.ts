import { Request, Response } from "express";
import { EmailTemplateService } from "./email-template.service";

const service = new EmailTemplateService();

type ContestParams = { contestId: string };
type TemplateParams = { templateId: string };

export class EmailTemplateController {
  create = async (req: Request<ContestParams>, res: Response) => {
    try {
      const data = await service.createEmailTemplate(
        req.params.contestId,
        req.body
      );
      return res
        .status(201)
        .json({ message: "Email template created successfully", data });
    } catch (e: any) {
      return res
        .status(e.statusCode || 400)
        .json({ message: e.message });
    }
  };

  getAll = async (req: Request<ContestParams>, res: Response) => {
    try {
      const { page, limit } = req.query as Record<string, string>;
      const parsedPage = page ? parseInt(page, 10) : 1;
      const parsedLimit = limit ? parseInt(limit, 10) : 10;

      const data = await service.getEmailTemplatesByContest(
        req.params.contestId,
        parsedPage,
        parsedLimit
      );
      return res
        .status(200)
        .json({ message: "Email templates fetched successfully", data });
    } catch (e: any) {
      return res
        .status(e.statusCode || 500)
        .json({ message: e.message });
    }
  };

  getById = async (req: Request<TemplateParams>, res: Response) => {
    try {
      const data = await service.getEmailTemplateById(req.params.templateId);
      return res
        .status(200)
        .json({ message: "Email template fetched successfully", data });
    } catch (e: any) {
      return res
        .status(e.statusCode || 404)
        .json({ message: e.message });
    }
  };

  update = async (req: Request<TemplateParams>, res: Response) => {
    try {
      const data = await service.updateEmailTemplate(
        req.params.templateId,
        req.body
      );
      return res
        .status(200)
        .json({ message: "Email template updated successfully", data });
    } catch (e: any) {
      return res
        .status(e.statusCode || 400)
        .json({ message: e.message });
    }
  };

  delete = async (req: Request<TemplateParams>, res: Response) => {
    try {
      const data = await service.deleteEmailTemplate(req.params.templateId);
      return res.status(200).json(data);
    } catch (e: any) {
      return res
        .status(e.statusCode || 500)
        .json({ message: e.message });
    }
  };
}
