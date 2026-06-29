import { PermissionRepository } from "@libs/repositories/permission.repository";
import { RoleRepository } from "@libs/repositories/role.repository";
import { createPermissionDto, updatePermissionDto, bulkSavePermissionsDto } from "@libs/dto/permission.dto";
import { PERMISSION_ROLE, Permission, Role } from "@libs/entities";
import { NotFoundError, ConflictError, BadRequestError } from "@libs/utils/errors.util";

export class PermissionService {
  private repo = new PermissionRepository();
  private roleRepo = new RoleRepository();

  private async resolveRole(role?: string, roleId?: string): Promise<Role> {
    if (roleId) {
      const roleEntity = await this.roleRepo.findById(roleId);
      if (!roleEntity) {
        throw new NotFoundError(`Role with ID ${roleId} not found`);
      }
      return roleEntity;
    } else if (role) {
      return this.roleRepo.ensureRoleExists(role);
    } else {
      throw new BadRequestError("Either role or roleId must be provided");
    }
  }

  async createPermission(payload: createPermissionDto) {
    const roleEntity = await this.resolveRole(payload.role, payload.roleId);
    const roleName = roleEntity.name;

    const existing = await this.repo.findByRoleAndModule(roleName, payload.module);
    if (existing) {
      throw new ConflictError(`Permission already exists for role ${roleName} on module ${payload.module}`);
    }

    if (roleEntity.id) {
      const existingById = await this.repo.findByRoleIdAndModule(roleEntity.id, payload.module);
      if (existingById) {
        throw new ConflictError(`Permission already exists for role ID ${roleEntity.id} on module ${payload.module}`);
      }
    }

    const upperRole = roleName.toUpperCase();
    const isStandardPermissionRole = Object.values(PERMISSION_ROLE).includes(upperRole as PERMISSION_ROLE);
    const legacyRoleValue = isStandardPermissionRole ? (upperRole as PERMISSION_ROLE) : null;

    const { role, roleId, ...rest } = payload;

    const newPermission = await this.repo.createPermission({
      ...rest,
      role: legacyRoleValue,
      roleEntity: roleEntity,
    });

    return {
      ...newPermission,
      roleId: newPermission.roleEntity?.id || newPermission.role_id,
    };
  }

  async getAllPermissions(role?: string) {
    const permissions = await this.repo.findAll(role);
    return permissions.map(p => ({
      ...p,
      roleId: p.roleEntity?.id || p.role_id,
    }));
  }

  async getPermissionById(id: string) {
    const permission = await this.repo.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }
    return {
      ...permission,
      roleId: permission.roleEntity?.id || permission.role_id,
    };
  }

  async updatePermission(id: string, payload: updatePermissionDto) {
    const permission = await this.repo.findById(id);
    if (!permission) {
      throw new NotFoundError("Permission not found");
    }

    const updateData: any = { ...payload };

    if (payload.role || payload.roleId || payload.module) {
      let roleEntity = permission.roleEntity;
      let roleName = permission.roleEntity?.name || permission.role;

      if (payload.roleId || payload.role) {
        const resolvedRole = await this.resolveRole(payload.role, payload.roleId);
        roleEntity = resolvedRole;
        roleName = resolvedRole.name;
      }

      if (!roleName) {
        throw new BadRequestError("Permission does not have a valid role");
      }

      const targetModule = payload.module ?? permission.module;
      const currentRoleName = permission.roleEntity?.name || permission.role;
      if (!currentRoleName) {
        throw new BadRequestError("Current permission does not have a valid role");
      }

      if (roleName !== currentRoleName || targetModule !== permission.module) {
        const existing = await this.repo.findByRoleAndModule(roleName, targetModule);
        if (existing && existing.id !== id) {
          throw new ConflictError(`Permission already exists for role ${roleName} on module ${targetModule}`);
        }
      }

      if (roleEntity?.id) {
        const existingById = await this.repo.findByRoleIdAndModule(roleEntity.id, targetModule);
        if (existingById && existingById.id !== id) {
          throw new ConflictError(`Permission already exists for role ID ${roleEntity.id} on module ${targetModule}`);
        }
      }

      if (payload.roleId || payload.role) {
        const upperRole = roleName.toUpperCase();
        const isStandardPermissionRole = Object.values(PERMISSION_ROLE).includes(upperRole as PERMISSION_ROLE);
        updateData.role = isStandardPermissionRole ? (upperRole as PERMISSION_ROLE) : null;
        updateData.roleEntity = roleEntity;
      }
    }

    delete updateData.roleId;

    const updatedPermission = await this.repo.updatePermission(id, updateData);
    return {
      ...updatedPermission,
      roleId: updatedPermission?.roleEntity?.id || updatedPermission?.role_id,
    };
  }

  async bulkSavePermissions(payload: bulkSavePermissionsDto) {
    const saved: any[] = [];
    for (const p of payload) {
      const roleEntity = await this.resolveRole(p.role, p.roleId);
      const roleName = roleEntity.name;

      const upperRole = roleName.toUpperCase();
      const isStandardPermissionRole = Object.values(PERMISSION_ROLE).includes(upperRole as PERMISSION_ROLE);
      const legacyRoleValue = isStandardPermissionRole ? (upperRole as PERMISSION_ROLE) : null;

      let permission = await this.repo.findByRoleAndModule(roleName, p.module);
      if (!permission && roleEntity.id) {
        permission = await this.repo.findByRoleIdAndModule(roleEntity.id, p.module);
      }
      if (permission) {
        permission.canView = p.canView ?? permission.canView;
        permission.canCreate = p.canCreate ?? permission.canCreate;
        permission.canEdit = p.canEdit ?? permission.canEdit;
        permission.canDelete = p.canDelete ?? permission.canDelete;
        permission.role = legacyRoleValue;
        permission.roleEntity = roleEntity;
        const savedPermission = await this.repo.save(permission);
        saved.push({
          ...savedPermission,
          roleId: savedPermission.roleEntity?.id || savedPermission.role_id,
        });
      } else {
        const { role, roleId, ...rest } = p;
        const newPermission = await this.repo.createPermission({
          ...rest,
          role: legacyRoleValue,
          roleEntity: roleEntity,
        });
        saved.push({
          ...newPermission,
          roleId: newPermission.roleEntity?.id || newPermission.role_id,
        });
      }
    }
    return saved;
  }

  async deletePermission(id: string) {
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
