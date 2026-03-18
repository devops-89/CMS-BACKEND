import { Request, Response } from "express";
import {
  ParticipantProfileRepository,
  UserRepository,
  JudgeProfileRepository,
  AdminProfileRepository,
} from "@libs/repositories";

import {
    deleteUserByIdDto,
    deleteUserByIdSchema,
    getUserByIdDto,
  getUsersQueryDto,
  updateAdminProfileDto,
  updateAvatarDto,
  updateJudgeProfileDto,
  updateParticipantProfileDto,
} from "@libs/dto/user.dto";
import { AuthRequest } from "@libs/middlewares/auth.middleware";

export class UserController {
  private userRepo = new UserRepository();
  private adminRepo = new AdminProfileRepository();
  private judgeRepo = new JudgeProfileRepository();
  private participantRepo = new ParticipantProfileRepository();

  // get Profile
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const user = await this.userRepo.getUserById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User Not Found!",
        });
      }

      return res.status(200).json({
        message: "Profile Fetched Successfully.",
        data: user,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed To Fetch Profile!",
        error: error.message,
      });
    }
  }

  // Update Admin Profile
  async updateAdminProfile(
    req: AuthRequest<{}, {}, updateAdminProfileDto>,
    res: Response,
  ) {
    try {
      const userId = req.user!.userId;
      const updated = await this.adminRepo.updateAdminProfile(userId, req.body);

      return res.status(200).json({
        message: "Admin Profile Updated Successfully!",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed to update admin Profile!",
        error: error.message,
      });
    }
  }

  // Update Judge Profile
  async updateJudgeProfile(
    req: AuthRequest<{}, {}, updateJudgeProfileDto>,
    res: Response,
  ) {
    try {
      const userId = req.user!.userId;

      const updated = await this.judgeRepo.updateJudgeProfile(userId, req.body);

      return res.status(200).json({
        message: "Judge Profile Updated Successfully.",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed To Update Judge Profile!",
        error: error.message,
      });
    }
  }

  // update Participant Profile
  async updateParticipantProfile(
    req: AuthRequest<{}, {}, updateParticipantProfileDto>,
    res: Response,
  ) {
    try {
      const userId = req.user!.userId;

      const updated = await this.participantRepo.updateParticipantProfile(
        userId,
        req.body,
      );

      return res.status(200).json({
        message: "Participant Profile Updated Successfully.",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed To Update Participant Profile!",
        error: error.message,
      });
    }
  }

  // update the profile pic adding
  async updateAvatar(req: AuthRequest<{}, {}, updateAvatarDto>, res: Response) {
    try {
      const userId = req.user!.userId;
      const { avatarUrl } = req.body;

      const updated = await this.userRepo.updateAvatar(userId, avatarUrl);

      return res.status(200).json({
        message: "Avatar Updated Successfully.",
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Failed To Update Avatar!",
        error: error.message,
      });
    }
  }

  // get all users with role filter
 async getUsers(
  req: AuthRequest,
  res: Response
) {
  try {
    const { role, page, limit } = req.query as getUsersQueryDto;

    const result = await this.userRepo.getUsers({
      role,
      page,
      limit
    });

    return res.status(200).json({
      message: "Users Fetched Successfully.",
      data: result
    });

  } catch (error: any) {

    return res.status(500).json({
      message: "Failed To Fetch Users!",
      error: error.message
    });

  }
}

// get User Detail By Id
async getUserById(req:AuthRequest<getUserByIdDto>, res:Response){
    try{
        const {id}=req.params;

        const user=await this.userRepo.getUserById(id);

        if(!user){
            return res.status(404).json({
                message:"User Not Found!"
            });
        }

        return res.status(200).json({
            message:"User Fetched Successfully.",
            data:user
        })

    }
    catch(error:any){
        return res.status(500).json({
            message:"Failed To Fetch User!",
            error:error.message
        })

    }
}

// delete User by Id
async deleteUserById(req:AuthRequest<deleteUserByIdDto>,res:Response){
    try{
      const {id}=req.params;

      const deleted=await this.userRepo.deleteUser(id);

      if(!deleted){
        return res.status(404).json({
            message:"User Not Found!"
        });
    }

        return res.status(200).json({
            message:"User Deleted Suceessfully.",
            data:{id}
        });


      
    }
    catch(error:any){

        return res.status(500).json({
           message:"Failed To Delete The User!",
           error:error.message
        });

    }
}


}
