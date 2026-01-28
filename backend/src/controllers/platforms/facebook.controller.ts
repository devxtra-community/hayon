import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import { ENV } from "../../config/env";
import { facebookService } from "../../services/platforms/facebook.service";
import {
  updateFacebookDetails,
  updateInstagramDetails,
  findPlatformAccountByUserId,
} from "../../repositories/platform.repository";

export const connectFacebook = (req: Request, res: Response) => {
  if (!req.auth) return new ErrorResponse("Unauthorized", { status: 401 }).send(res);

  const fbScopes = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
    "pages_manage_metadata",
    "public_profile",
    "business_management",
  ].join(",");

  const redirectUri = ENV.META.REDIRECT_URI;
  const appId = ENV.META.APP_ID;
  const state = req.auth.id;

  const authUrl =
    `https://www.facebook.com/v24.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${fbScopes}` +
    `&state=${state}` +
    `&response_type=code`;

  return new SuccessResponse("Facebook auth URL generated", { data: { url: authUrl } }).send(res);
};

export const facebookCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings?error=facebook_auth_failed`);
  }

  try {
    const shortToken = await facebookService.getFacebookShortLivedToken(code as string);
    const longToken = await facebookService.getFacebookLongLivedToken(shortToken);

    const pages = await facebookService.getFacebookPages(longToken);
    let linkedPageId = "";
    let linkedIgId = "";
    let fbProfile: Record<string, unknown> = {};
    let igProfile: Record<string, unknown> = {};

    const fbUser = await facebookService.getFacebookUserProfile(longToken);
    fbProfile = {
      displayName: fbUser.name,
      avatar: fbUser.picture?.data?.url,
    };

    if (pages && pages.length > 0) {
      const page = pages[0];
      linkedPageId = page.id;

      fbProfile = {
        displayName: page.name,
        avatar: page.picture?.data?.url,
        handle: page.username || "",
      };

      const igAccount = await facebookService.getInstagramBusinessAccount(page.id, longToken);
      if (igAccount && igAccount.instagram_business_account) {
        const igData = igAccount.instagram_business_account;
        linkedIgId = igData.id;
        igProfile = {
          displayName: igData.name,
          handle: igData.username,
          avatar: igData.profile_picture_url,
        };
      }
    }

    const userId = req.query.state as string;

    if (userId) {
      const page = pages && pages.length > 0 ? pages[0] : null;
      const pageAccessToken = page?.access_token || longToken;

      await updateFacebookDetails(userId, {
        connected: true,
        platformId: linkedPageId || fbUser.id,
        profile: fbProfile,
        auth: {
          accessToken: pageAccessToken, // Store PAGE token here
          refreshToken: "",
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        },
        health: { status: "active" },
      });

      if (linkedIgId) {
        await updateInstagramDetails(userId, {
          connected: true,
          platformId: linkedIgId,
          profile: igProfile,
          auth: {
            accessToken: longToken, // Instagram uses USER token
            refreshToken: "",
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
          linkedPageId: linkedPageId,
          businessId: linkedIgId,
          health: { status: "active" },
        });
      }
    } else {
      logger.warn("No authenticated user found in Facebook Callback");
    }

    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings`);
  } catch (error: unknown) {
    logger.error("Facebook Connect Error", error);
    return res.redirect(`${ENV.APP.FRONTEND_URL}/settings?error=facebook_connect_failed`);
  }
};

export const disconnectFacebook = async (req: Request, res: Response) => {
  try {
    if (!req.auth) return new ErrorResponse("Unauthorized", { status: 401 }).send(res);

    // Disconnect both FB and IG since they are linked in this flow
    await updateFacebookDetails(req.auth.id, {
      connected: false,
      platformId: null,
      auth: {},
      profile: {},
    });
    await updateInstagramDetails(req.auth.id, {
      connected: false,
      platformId: null,
      auth: {},
      profile: {},
    });

    return new SuccessResponse("Facebook disconnected successfully").send(res);
  } catch (error: unknown) {
    logger.error("Disconnect Facebook Error", error);
    return new ErrorResponse("Failed to disconnect").send(res);
  }
};

export const refreshFacebookProfile = async (req: Request, res: Response) => {
  try {
    if (!req.auth) return new ErrorResponse("Unauthorized", { status: 401 }).send(res);

    const userId = req.auth.id;
    const socialAccount = await findPlatformAccountByUserId(userId);

    logger.info(
      `[FB Refresh] User: ${userId}, Has SocialAccount: ${!!socialAccount}, FB Connected: ${socialAccount?.facebook?.connected}, Has Auth: ${!!socialAccount?.facebook?.auth}, Has Token: ${!!socialAccount?.facebook?.auth?.accessToken}`,
    );

    if (!socialAccount || !socialAccount.facebook?.connected) {
      return new ErrorResponse("Facebook account not connected", { status: 400 }).send(res);
    }

    if (!socialAccount.facebook.auth?.accessToken) {
      return new ErrorResponse("Facebook session expired or missing. Please reconnect.", {
        status: 400,
      }).send(res);
    }

    const longToken = socialAccount.facebook.auth.accessToken;
    const fbUser = await facebookService.getFacebookUserProfile(longToken);

    let fbProfile = {
      displayName: fbUser.name,
      avatar: fbUser.picture?.data?.url,
      handle: "",
    };
    let fbPlatformId = fbUser.id;

    // Also refresh Linked Instagram if exists
    // We re-check pages to find connected IG
    const pages = await facebookService.getFacebookPages(longToken);
    let pageAccessToken = longToken;

    if (pages && pages.length > 0) {
      const page = pages[0];
      fbPlatformId = page.id;
      pageAccessToken = page.access_token || longToken;
      fbProfile = {
        displayName: page.name,
        avatar: page.picture?.data?.url,
        handle: page.username || "",
      };

      const igAccount = await facebookService.getInstagramBusinessAccount(page.id, longToken);

      if (igAccount && igAccount.instagram_business_account) {
        const igData = igAccount.instagram_business_account;
        const igProfile = {
          displayName: igData.name,
          handle: igData.username,
          avatar: igData.profile_picture_url,
        };

        await updateInstagramDetails(userId, {
          connected: true,
          profile: igProfile,
          platformId: igData.id,
          auth: {
            accessToken: longToken, // IG uses User token
          },
        });
      }
    }

    await updateFacebookDetails(userId, {
      connected: true,
      platformId: fbPlatformId,
      profile: fbProfile,
      auth: {
        accessToken: pageAccessToken, // FB uses Page token
      },
    });

    return new SuccessResponse("Facebook & Instagram profiles refreshed").send(res);
  } catch (error: unknown) {
    logger.error("Refresh Facebook Error", error);
    return new ErrorResponse("Failed to refresh Facebook profile", { status: 500 }).send(res);
  }
};
