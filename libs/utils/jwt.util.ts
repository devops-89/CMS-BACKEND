import jwt from "jsonwebtoken";

export const generateAccessToken=(payload:any)=>{
   return jwt.sign(payload,process.env.JWT_SECRET!,{
    expiresIn:"1d"
   });
};


export const generateRefreshToken=(payload:any)=>{
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!,{
        expiresIn:"7d"
    });
}