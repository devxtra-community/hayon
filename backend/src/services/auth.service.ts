import bcrypt from "bcrypt";
import { findByEmail, createUser } from "../repositories/user.repository";
import { generateToken } from "../utils/jwt";

export const signupService = async (data: any) => {
  const { email, password, confirmPassword, name } = data;

  if (!email || !password || !confirmPassword || !name) {
    throw new Error("Missing required fields");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const existingUser = await findByEmail(email.toLowerCase());
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await createUser({
    email: email.toLowerCase(),
    name,
    auth: {
      provider: "email",
      password_hash,
      email_verified: false,
    },
    role: "user",
  });

  const token = generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return { user, token };
};
