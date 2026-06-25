import { PermissionRepository } from "@libs/repositories/permission.repository";
import { createPermissionDto, updatePermissionDto, bulkSavePermissionsDto } from "@libs/dto/permission.dto";
import { PERMISSION_ROLE, Permission } from "@libs/entities";
import { NotFoundError, ConflictError } from "@libs/utils/errors.util";

export class PermissionService {
  private repo = new PermissionRepository();

  async createPermission(payload: createPermissionDto) {
    const existing = await this.repo.findByRoleAndModule(payload.role, payload.module);
    if (existing) {
      throw new ConflictError(`Permission already exists for role ${payload.role} on module ${payload.module}`);
    }
    return this.repo.createPermission(payload);
  }

  async getAllPermissions(role?: PERMISSION_ROLE) {
    return this.repo.findAll(role);
  }

  async getPermissionById(id: number) {
    const permission = await this.repo.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    return permission;
  }

  async updatePermission(id: number, payload: updatePermissionDto) {
    const permission = await this.repo.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }

    if (payload.role || payload.module) {
      const targetRole = payload.role ?? permission.role;
      const targetModule = payload.module ?? permission.module;
      if (targetRole !== permission.role || targetModule !== permission.module) {
        const existing = await this.repo.findByRoleAndModule(targetRole, targetModule);
        if (existing && existing.id !== id) {
          throw new ConflictError(`Permission already exists for role ${targetRole} on module ${targetModule}`);
        }
      }
    }

    return this.repo.updatePermission(id, payload);
  }

  async bulkSavePermissions(payload: bulkSavePermissionsDto) {
    const saved: Permission[] = [];
    for (const p of payload) {
      let permission = await this.repo.findByRoleAndModule(p.role, p.module);
      if (permission) {
        permission.canView = p.canView ?? permission.canView;
        permission.canCreate = p.canCreate ?? permission.canCreate;
        permission.canEdit = p.canEdit ?? permission.canEdit;
        permission.canDelete = p.canDelete ?? permission.canDelete;
        saved.push(await this.repo.save(permission));
      } else {
        const newPermission = await this.repo.createPermission(p);
        saved.push(newPermission);
      }
    }
    return saved;
  }

  async deletePermission(id: number) {
    const permission = await this.repo.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    const success = await this.repo.deletePermission(id);
    if (!success) {
      throw new NotFoundError("Permission not found during deletion");
    }
  }
}
