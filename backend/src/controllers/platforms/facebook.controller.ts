import { Request, Response } from "express";
import { ErrorResponse, SuccessResponse } from "../../utils/responses";
import logger from "../../utils/logger";
import { ENV } from "../../config/env";
import { facebookService } from "../../services/platforms/facebook.service";
import {
    updateFacebookDetails,
    updateInstagramDetails
} from "../../repositories/platform.repository";

export const connectFacebook = (req: Request, res: Response) => {
    if (!req.auth) return res.status(401).send("Unauthorized");

    const fbScopes = [
        'instagram_basic', 'instagram_content_publish', 'instagram_manage_insights',
        'pages_show_list', 'pages_read_engagement', 'public_profile', 'business_management'
    ].join(',');

    const redirectUri = ENV.META.REDIRECT_URI;
    const appId = ENV.META.APP_ID;
    const state = req.auth.id;

    const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?` +
        `client_id=${appId}` +
        `&redirect_uri=${redirectUri}` +
        `&scope=${fbScopes}` +
        `&state=${state}` +
        `&response_type=code`;

    new SuccessResponse("Facebook auth URL generated", { data: { url: authUrl } }).send(res);
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
        let fbProfile: any = {};
        let igProfile: any = {};

        const fbUser = await facebookService.getFacebookUserProfile(longToken);
        fbProfile = {
            displayName: fbUser.name,
            avatar: fbUser.picture?.data?.url
        };

        if (pages && pages.length > 0) {
            const page = pages[0];
            linkedPageId = page.id;

            const igAccount = await facebookService.getInstagramBusinessAccount(page.id, longToken);
            if (igAccount && igAccount.instagram_business_account) {
                linkedIgId = igAccount.instagram_business_account.id;
                igProfile = {
                    displayName: igAccount.name,
                    handle: igAccount.username,
                    avatar: igAccount.picture?.data?.url
                };
            }
        }

        const userId = req.query.state as string;

        if (userId) {
            await updateFacebookDetails(userId, {
                connected: true,
                platformId: fbUser.id,
                profile: fbProfile,
                auth: {
                    accessToken: longToken,
                    refreshToken: "",
                    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
                },
                health: { status: 'active' }
            });

            if (linkedIgId) {
                await updateInstagramDetails(userId, {
                    connected: true,
                    platformId: linkedIgId,
                    profile: igProfile,
                    auth: {
                        accessToken: longToken,
                        refreshToken: "",
                        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                    },
                    linkedPageId: linkedPageId,
                    businessId: linkedIgId,
                    health: { status: 'active' }
                });
            }
        } else {
            logger.warn("No authenticated user found in Facebook Callback");
        }

        res.redirect(`${ENV.APP.FRONTEND_URL}/settings`);

    } catch (error) {
        logger.error("Facebook Connect Error", error);
        res.redirect(`${ENV.APP.FRONTEND_URL}/settings?error=facebook_connect_failed`);
    }
};

export const disconnectFacebook = async (req: Request, res: Response) => {
    try {
        if (!req.auth) return new ErrorResponse("Unauthorized", { status: 401 }).send(res);

        // Disconnect both FB and IG since they are linked in this flow
        await updateFacebookDetails(req.auth.id, { connected: false, platformId: null, auth: {}, profile: {} });
        await updateInstagramDetails(req.auth.id, { connected: false, platformId: null, auth: {}, profile: {} });

        return new SuccessResponse("Facebook disconnected successfully").send(res);
    } catch (error) {
        logger.error("Disconnect Facebook Error", error);
        return new ErrorResponse("Failed to disconnect").send(res);
    }
};
