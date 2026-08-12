import { Request, Response } from "express";
import { FormBuilderService } from "./form-builder.service";
import { CreateTemplateDto, SubmitFormDto, TemplateIdParamDto, TemplateParamDto } from "@libs/dto/form-builder.dto";

const service = new FormBuilderService();

export class FormBuilderController {

  createTemplate = async (req: Request<{},{},CreateTemplateDto>, res: Response) => {
    try {
      const data = await service.createTemplate(req.body);

      return res.status(201).json({
        message: "Template created successfully",
        data
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  };

  getTemplates = async (_req: Request, res: Response) => {
    const data = await service.getTemplates();

    return res.status(200).json({
      message: "Templates fetched",
      data
    });
  };

getTemplate = async (req: Request<TemplateParamDto>, res: Response) => {
  try {
    const id = req.params.id; 

    const data = await service.getTemplateById(id);

    return res.status(200).json({
      message: "Template fetched",
      data
    });
  } catch (error: any) {
    return res.status(404).json({ message: error.message });
  }
};

  submitForm = async (req: Request<TemplateIdParamDto,{},SubmitFormDto>, res: Response) => {
  try {
    const templateId = req.params.templateId; 

    const data = await service.submitForm(templateId, req.body);

    return res.status(201).json({
      message: "Form submitted successfully",
      data
    });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

  getSubmissions = async (req: Request<TemplateIdParamDto,{},{}>, res: Response) => {
   try{

    const templateId = req.params.templateId; 

  const data = await service.getSubmissions(templateId);

  return res.status(200).json({
    message: "Submissions fetched",
    data
  });

   }
   catch(error:any){
     return res.status(400).json({ message: error.message });
   }
};


// update the template by id
updateTemplate = async (
  req: Request<TemplateParamDto, {}, CreateTemplateDto>,
  res: Response
) => {
  try {
    const id = req.params.id;

    const data = await service.updateTemplate(id, req.body);

    return res.status(200).json({
      message: "Template updated successfully",
      data
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal Server Error"
    });
  }
};

// delete the template by id
deleteTemplate = async (
  req: Request<TemplateParamDto>,
  res: Response
) => {
  try {
    const id = req.params.id;

    const data = await service.deleteTemplate(id);

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal Server Error"
    });
  }
};


}