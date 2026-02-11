import { Request, Response } from "express";
import {
  findAllUsers,
  updateUserSubscription,
  updateUserActivityById,
  getUsersAnalytics,
} from "../repositories/user.repository";
import { SuccessResponse, ErrorResponse } from "../utils/responses";
import logger from "../utils/logger";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await findAllUsers();
    return new SuccessResponse("Users retrieved successfully", { data: users }).send(res);
  } catch (error: any) {
    logger.error("Failed to retrieve users", { error });
    return new ErrorResponse("Failed to retrieve users", { status: 500 }).send(res);
  }
};

export const updateUserPlan = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const plan = req.query.plan as "free" | "pro";
  console.log("Updating user plan for userId:", userId, "to plan:", plan); // Debugging line

  if (!plan || (plan !== "free" && plan !== "pro")) {
    return new ErrorResponse("Invalid plan type. Must be 'free' or 'pro'", { status: 400 }).send(
      res,
    );
  }
  try {
    await updateUserSubscription(userId, plan);
    return new SuccessResponse("User plan updated successfully", { data: { userId, plan } }).send(
      res,
    );
  } catch (error) {
    logger.error("Failed to update user plan", { error, userId, plan });
    return new ErrorResponse("Failed to update user plan", { status: 500 }).send(res);
  }
};

export const updateUserActivity = async (req: Request, res: Response) => {
  const userId = req.params.id;
  const { activity } = req.body;

  if (typeof activity !== "boolean") {
    return new ErrorResponse("Invalid activity status. Must be a boolean.", { status: 400 }).send(
      res,
    );
  }
  try {
    const updatedUser = await updateUserActivityById(userId, activity);
    return new SuccessResponse("User activity status updated successfully", {
      data: updatedUser,
    }).send(res);
  } catch (error) {
    logger.error("Failed to update user activity status", { error, userId, activity });
    return new ErrorResponse("Failed to update user activity status", { status: 500 }).send(res);
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { totalUsers, activeUsers, inactiveUsers, paidUsers, topPlan } =
      await getUsersAnalytics();

    // Implement analytics logic here (e.g., aggregate user data, usage statistics, etc.)
    const analyticsData = {
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      inactiveUsers: inactiveUsers,
      paidUsers: paidUsers,
      monthlyGrowth: 25.5, // Example of a simple analytics metric
      topPlan: topPlan === "pro" ? "Professional" : "Free",
    };

    return new SuccessResponse("Analytics retrieved successfully", { data: analyticsData }).send(
      res,
    );
  } catch (error) {
    logger.error("Failed to retrieve analytics", { error });
    return new ErrorResponse("Failed to retrieve analytics", { status: 500 }).send(res);
  }
};
