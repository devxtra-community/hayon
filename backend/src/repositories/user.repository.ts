import User from "../models/user.model";

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
