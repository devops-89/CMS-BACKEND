import {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest<P={},ResBody=any,ReqBody=any,Query={}> extends Request<P, ResBody, ReqBody, Query>{
    user?:{
        userId:string,
        role:string
    }
}

export const authenticate=(req:AuthRequest, res:Response, next:NextFunction)=>{
     const header=req.headers.authorization;

     if(!header){
        return res.status(401).json({
            message:"Token Required!"
        })
     }

     const token=header.split(" ")[1];

     try{
        const decoded:any=jwt.verify(
        token,
        process.env.JWT_SECRET!
        );

        req.user=decoded;

        next();
     }
     catch {
        return res.status(401).json({
            message:"Invalid Token"
        })

     }
}