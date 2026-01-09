import axios from "axios";
import { tumblrOAuth } from "../../utils/tumblrOAuth";
import { getTempToken, deleteTempToken, setTempToken } from "../../utils/tumblrTempStore";
import type { AxiosRequestHeaders } from "axios";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import { Request, Response } from "express";
import { updateTumblerDetails } from "../../repositories/platform.repository";
import { ENV } from "../../config/env";

export const connectTumblr = async (req: Request, res: Response) => {
  const userId = req?.auth?.id as string;
  const requestData = {
    url: "https://www.tumblr.com/oauth/request_token",
    method: "POST",
    data: {
      oauth_callback: `http://localhost:5000/api/platform/tumblr/callback?state=${userId}`,
    },
  };

  const headers = tumblrOAuth.toHeader(tumblrOAuth.authorize(requestData)) as AxiosRequestHeaders;

  const response = await axios.post(requestData.url, null, { headers });

  const params = new URLSearchParams(response.data);
  const oauthToken = params.get("oauth_token")!;
  const oauthTokenSecret = params.get("oauth_token_secret")!;

  setTempToken(oauthToken, oauthTokenSecret);

  return new SuccessResponse("Tumblr request token obtained", {
    data: {
      authUrl: `https://www.tumblr.com/oauth/authorize?oauth_token=${oauthToken}&state=${userId}`,
    },
  }).send(res);
};

// Callbakc controller

export const tumblrCallback = async (req: Request, res: Response) => {
  const { oauth_token, oauth_verifier, state } = req.query as {
    oauth_token: string;
    oauth_verifier: string;
    state: string;
  };

  const userId = req.query.state as string;

  console.log("Tumblr callback received:", { oauth_token, oauth_verifier, state });

  // 1️⃣ Get request token secret
  const requestTokenSecret = getTempToken(oauth_token);
  if (!requestTokenSecret) {
    return res.status(400).send("Tumblr OAuth session expired");
  }

  // 2️⃣ Exchange request token → access token
  const accessTokenRequest = {
    url: "https://www.tumblr.com/oauth/access_token",
    method: "POST",
    data: { oauth_verifier },
  };

  const accessTokenHeaders = tumblrOAuth.toHeader(
    tumblrOAuth.authorize(accessTokenRequest, {
      key: oauth_token,
      secret: requestTokenSecret,
    }),
  ) as AxiosRequestHeaders;

  const tokenRes = await axios.post(accessTokenRequest.url, null, { headers: accessTokenHeaders });

  const tokenParams = new URLSearchParams(tokenRes.data);

  const accessToken = tokenParams.get("oauth_token")!;
  const accessSecret = tokenParams.get("oauth_token_secret")!;

  deleteTempToken(oauth_token);

  // 3️⃣ Fetch user info (ONLY for username)
  const userInfoUrl = "https://api.tumblr.com/v2/user/info";

  const userHeaders = tumblrOAuth.toHeader(
    tumblrOAuth.authorize(
      { url: userInfoUrl, method: "GET" },
      {
        key: accessToken,
        secret: accessSecret,
      },
    ),
  ) as AxiosRequestHeaders;

  const userRes = await axios.get(userInfoUrl, {
    headers: userHeaders,
  });

  const tumblrUsername: string = userRes.data.response.user.name;

  // 4️⃣ Build profile image (Tumblr uses primary blog avatar)
  const avatarUrl = `https://api.tumblr.com/v2/blog/${tumblrUsername}.tumblr.com/avatar/512`;

  await updateTumblerDetails(userId, {
    connected: true,
    auth: {
      accessToken,
      accessTokenSecret: accessSecret,
    },
    profile: {
      handle: tumblrUsername,
      avatar: avatarUrl,
    },
  });

  res.redirect(`${ENV.APP.FRONTEND_URL}/settings`);
  return new SuccessResponse("Tumblr connected successfully").send(res);
};

export const disconnectTumblr = async (req: Request, res: Response) => {
  try {
    if (!req.auth) {
      return new ErrorResponse("User not authenticated", { status: 401 }).send(res);
    }
    await updateTumblerDetails(req.auth.id, {
      connected: false,
      auth: {
        accessToken: null,
        accessTokenSecret: null,
      },
      profile: {
        handle: null,
        avatar: null,
      },
    });

    return new SuccessResponse("Tumblr disconnected successfully").send(res);
  } catch (error) {
    logger.error(error);
    return new ErrorResponse("Failed to disconnect from Tumblr", { status: 500 }).send(res);
  }
};
