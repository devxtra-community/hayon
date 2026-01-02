import User from "../models/user.model";
import crypto from "crypto";
import { ErrorResponse } from "../utils/responses";
import bcrypt from "bcrypt";
import logger from "../utils/logger";

export const findUserByEmail = async (email: string) => {
  return User.findOne({ email });
};

export const createUser = async (data: any) => {
  return User.create(data);
};

// check fields 

export const findUserByIdSafe = async (userId: string) => {
  return User.findById(userId).select(
    "-auth.passwordHash -auth.verificationToken -auth.resetToken"
  );
};

export const setPasswordResetToken = async (email:string) => {

   const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorResponse("User not found"); 
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = bcrypt.hashSync(resetToken, 12);

    await User.updateOne(
    { email },
     {
       $set:{
       "auth.passwordResetToken":{
        token: hashedToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    }
    }
  );
  return resetToken;
}

export const findResetPasswordToken = async (email:string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorResponse("User not found");
  }
  logger.info(`Found reset token for user ${email}: ${user}`);
  return user.auth.passwordResetToken?.token;
}

export const updateUserPassword = async (email:string, newPasswordHash:string) => {
   return User.updateOne(
    { email },
    { auth: { passwordHash: newPasswordHash } } 
  );
}