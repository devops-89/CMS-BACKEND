import {Response, NextFunction} from "express";
import { AuthRequest } from "./auth.middleware";
import { AppDataSource } from "@libs/database/data-source";
import { Permission } from "@libs/entities";

export const authorize=(...roles:string[])=>{
   return async (req:AuthRequest, res:Response, next:NextFunction)=>{

    if(!req.user){
        return res.status(401).json({
            message:"Unauthorized!"
        })
    }
         
    const userRole = req.user.role;

    // 1. If user's role is in the list of allowed roles, allow it
    if(userRole && roles.includes(userRole)){
        return next();
    }

    // 2. Otherwise check database permissions dynamically
    try {
      const moduleName = getModuleName(req.originalUrl || req.url);
      if (moduleName && userRole) {
        const permission = await AppDataSource.getRepository(Permission)
          .createQueryBuilder("permission")
          .where("LOWER(CAST(permission.role AS VARCHAR)) = :role", { role: userRole.toLowerCase() })
          .andWhere("LOWER(permission.module) = :module", { module: moduleName.toLowerCase() })
          .getOne();

        if (permission) {
          const method = req.method;
          let hasPermission = false;
          if (method === "GET" && permission.canView) hasPermission = true;
          if (method === "POST" && permission.canCreate) hasPermission = true;
          if ((method === "PUT" || method === "PATCH") && permission.canEdit) hasPermission = true;
          if (method === "DELETE" && permission.canDelete) hasPermission = true;

          if (hasPermission) {
            return next();
          }
        }
      }
    } catch (err) {
      console.error("Error in dynamic authorization check:", err);
    }

    return res.status(403).json({
        message:"Forbidden!"
    })

   }
}

const getModuleName = (path: string): string | null => {
  const normalized = path.toLowerCase();
  if (normalized.includes("contest")) return "contest";
  if (normalized.includes("vote")) return "vote";
  if (normalized.includes("judge")) return "judge";
  if (normalized.includes("entry") || normalized.includes("entries")) return "entry";
  if (normalized.includes("user")) return "user";
  if (normalized.includes("permission")) return "permission";
  if (normalized.includes("country") || normalized.includes("countries")) return "country";
  return null;
};