import { createBlueskyAgent } from "../services/blueSky.service";
import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../utils/responses";

export const connectBluesky = async (req: Request, res: Response) => {
  try {
    const { handle, appPassword } = req.body;

    if (!handle || !appPassword) {
      return new ErrorResponse("Missing handle or app password", { status: 400 }).send(res);
    }

    const agent = createBlueskyAgent();

    // 🔑 CREATE SESSION
    const session = await agent.login({
      identifier: handle,
      password: appPassword,
    });

    /**
     * session contains:
     * - accessJwt
     * - refreshJwt
     * - did
     * - handle
     */

    // // 💾 STORE TOKENS (DB)
    // await saveBlueskyAccount({
    //   userId: req.user.id, // your auth middleware
    //   did: session.did,
    //   handle: session.handle,
    //   accessToken: session.accessJwt,
    //   refreshToken: session.refreshJwt,
    // });

    return new SuccessResponse("Bluesky connected successfully", session).send(res);
  } catch (error) {
    console.error(error);
    return new ErrorResponse("Failed to connect to Bluesky", { status: 500 }).send(res);
  }
};
