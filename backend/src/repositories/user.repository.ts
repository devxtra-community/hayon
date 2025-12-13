import User from "../models/user.model";

export const findByEmail = async (email: string) => {
  return User.findOne({ email });
};

export const createUser = async (data: any) => {
  return User.create(data);
};