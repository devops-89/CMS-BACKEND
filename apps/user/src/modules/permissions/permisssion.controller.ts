import { Request, Response } from "express";
import { PermissionService } from "./permission.service";
import { createPermissionDto, updatePermissionDto, bulkSavePermissionsDto, getPermissionsQueryDto } from "@libs/dto/permission.dto";

export class PermissionController {
  private service = new PermissionService();

  create = async (req: Request<{}, {}, createPermissionDto>, res: Response) => {
    try {
      const permission = await this.service.createPermission(req.body);
      return res.status(201).json({
        message: "Permission created successfully",
        data: permission,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getAll = async (req: Request<{}, {}, {}, getPermissionsQueryDto>, res: Response) => {
    try {
      const role = req.query.role;
      const permissions = await this.service.getAllPermissions(role);
      return res.status(200).json({
        message: "Permissions fetched successfully",
        data: permissions,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOne = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const permission = await this.service.getPermissionById(id);
      return res.status(200).json({
        message: "Permission fetched successfully",
        data: permission,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  update = async (req: Request<{ id: string }, {}, updatePermissionDto>, res: Response) => {
    try {
      const id = Number(req.params.id);
      const permission = await this.service.updatePermission(id, req.body);
      return res.status(200).json({
        message: "Permission updated successfully",
        data: permission,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  bulkSave = async (req: Request<{}, {}, bulkSavePermissionsDto>, res: Response) => {
    try {
      const permissions = await this.service.bulkSavePermissions(req.body);
      return res.status(200).json({
        message: "Permissions saved successfully",
        data: permissions,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = Number(req.params.id);
      await this.service.deletePermission(id);
      return res.status(200).json({
        message: "Permission deleted successfully",
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}
