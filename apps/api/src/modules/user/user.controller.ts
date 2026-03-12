import {Request,Response} from "express";
import { ParticipantProfileRepository, UserRepository, JudgeProfileRepository, AdminProfileRepository } from "@libs/repositories";
import { UserRole } from "@libs/entities";
import { updateAdminProfileDto,updateJudgeProfileDto, updateParticipantProfileDto } from "@libs/dto/user.dto";
import { AuthRequest } from "../../middlewares/auth.middleware";


export class UserController{

    private userRepo=new UserRepository();
    private adminRepo=new AdminProfileRepository();
    private judgeRepo=new JudgeProfileRepository();
    private participantRepo=new ParticipantProfileRepository();



    // get Profile
    async getProfile(req:AuthRequest,res:Response){
        try{
            const userId=req.user!.userId;

        const user= await this.userRepo.findById(userId);

        if(!user){
            return res.status(404).json({
                message:"User Not Found!"
            })
        }

        return res.status(200).json({
            message:"Profile Fetched Successfully.",
            data:user
        });
        }
        catch(error:any){
            return res.status(500).json({
                message:"Failed To Fetch Profile!",
                error:error.message
            })
        }
    }

    // Update Admin Profile
    async updateAdminProfile(req:AuthRequest<{},{},updateAdminProfileDto>,res:Response){
        try{

            const userId=req.user!.userId;
            const updated=await this.adminRepo.updateAdminProfile(userId,req.body);

            return res.status(200).json({
                message:"Admin Profile Updated Successfully!",
                data:updated
            })
        }
        catch(error:any){
            return res.status(500).json({
                message:"Failed to update admin Profile!",
                error:error.message
            })
        }

    }

    // Update Judge Profile
    async updateJudgeProfile(req:AuthRequest<{},{},updateJudgeProfileDto>,res:Response){
        try{

             const userId=req.user!.userId;

         const updated=await this.judgeRepo.updateJudgeProfile(
            userId,
            req.body
         )

         return res.status(200).json({
            message:"Judge Profile Updated Successfully.",
            data:updated
         })
        }
        catch(error:any){
           return res.status(500).json({
            message:"Failed To Update Judge Profile!",
            error:error.message
           })
        }
    }


    // update Participant Profile
    async updateParticipantProfile(req: AuthRequest<{},{},updateParticipantProfileDto>, res:Response){
        try{
            const userId=req.user!.userId;

            const updated=await this.participantRepo.updateParticipantProfile(userId,req.body);

            return res.status(200).json({
                message:"Participant Profile Updated Successfully.",
                data:updated
            })

        }
        catch(error:any){
            return res.status(500).json({
                message:"Failed To Update Participant Profile!",
                error:error.message
            })
        }

    }
}