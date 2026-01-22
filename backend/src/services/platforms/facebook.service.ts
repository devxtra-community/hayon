import axios from "axios";
import { ENV } from "../../config/env";
import logger from "../../utils/logger";

const FB_GRAPH_URL = "https://graph.facebook.com/v24.0";

export class FacebookService {
  async getFacebookShortLivedToken(code: string): Promise<string> {
    const response = await axios.get(`${FB_GRAPH_URL}/oauth/access_token`, {
      params: {
        client_id: ENV.META.APP_ID,
        client_secret: ENV.META.APP_SECRET,
        redirect_uri: ENV.META.REDIRECT_URI,
        code,
      },
    });
    return response.data.access_token;
  }

  async getFacebookLongLivedToken(shortToken: string): Promise<string> {
    const response = await axios.get(`${FB_GRAPH_URL}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: ENV.META.APP_ID,
        client_secret: ENV.META.APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });
    return response.data.access_token;
  }

  async getFacebookPages(accessToken: string) {
    const response = await axios.get(`${FB_GRAPH_URL}/me/accounts`, {
      params: {
        fields: "id,name,picture{url},username,link,access_token",
        access_token: accessToken,
      },
    });
    return response.data.data;
  }

  async getInstagramBusinessAccount(pageId: string, accessToken: string) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/${pageId}`, {
        params: {
          fields:
            "instagram_business_account{id,username,name,profile_picture_url},name,picture{url},username",
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      logger.warn(`No IG account found for page ${pageId}`, error);
      return null;
    }
  }

  async getFacebookUserProfile(accessToken: string) {
    const response = await axios.get(`${FB_GRAPH_URL}/me`, {
      params: {
        fields: "id,name,picture",
        access_token: accessToken,
      },
    });
    return response.data;
  }
}

export const createPostServiceFacebook = () => { };

export const facebookService = new FacebookService();
