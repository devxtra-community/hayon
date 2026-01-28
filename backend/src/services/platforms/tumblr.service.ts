import axios from "axios";
import { tumblrOAuth } from "../../utils/tumblrOAuth";
import { getTempToken, deleteTempToken, setTempToken } from "../../utils/tumblrTempStore";
import type { AxiosRequestHeaders } from "axios";
import { ENV } from "../../config/env";

export class TumblrService {
  async getRequestToken(userId: string) {
    const callbackUrl = `${ENV.APP.BACKEND_URL}/api/platform/tumblr/callback?state=${userId}`;
    const requestData = {
      url: `https://www.tumblr.com/oauth/request_token?oauth_callback=${encodeURIComponent(callbackUrl)}`,
      method: "POST",
      data: { oauth_callback: callbackUrl },
    };

    const headers = tumblrOAuth.toHeader(tumblrOAuth.authorize(requestData)) as AxiosRequestHeaders;
    const response = await axios.post(requestData.url, null, { headers });

    const params = new URLSearchParams(response.data);
    const oauthToken = params.get("oauth_token")!;
    const oauthTokenSecret = params.get("oauth_token_secret")!;

    setTempToken(oauthToken, oauthTokenSecret);

    return {
      authUrl: `https://www.tumblr.com/oauth/authorize?oauth_token=${oauthToken}&state=${userId}`,
    };
  }

  async getAccessToken(oauthToken: string, oauthVerifier: string) {
    const requestTokenSecret = getTempToken(oauthToken);
    if (!requestTokenSecret) {
      throw new Error("Tumblr OAuth session expired");
    }

    const accessTokenRequest = {
      url: "https://www.tumblr.com/oauth/access_token",
      method: "POST",
      data: { oauth_verifier: oauthVerifier },
    };

    const accessTokenHeaders = tumblrOAuth.toHeader(
      tumblrOAuth.authorize(accessTokenRequest, {
        key: oauthToken,
        secret: requestTokenSecret,
      }),
    ) as AxiosRequestHeaders;

    const tokenRes = await axios.post(accessTokenRequest.url, null, {
      headers: accessTokenHeaders,
    });

    const tokenParams = new URLSearchParams(tokenRes.data);
    const accessToken = tokenParams.get("oauth_token")!;
    const accessSecret = tokenParams.get("oauth_token_secret")!;

    deleteTempToken(oauthToken);

    return { accessToken, accessSecret };
  }

  async getUserInfo(accessToken: string, accessSecret: string) {
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
    const blogs = userRes.data.response.user.blogs;
    const primaryBlog = blogs.find((b: any) => b.primary === true) || blogs[0];
    const blogHostname = primaryBlog.name; // This is the identifier used in API paths

    const avatarUrl = `https://api.tumblr.com/v2/blog/${blogHostname}.tumblr.com/avatar/512`;

    return {
      handle: tumblrUsername,
      blogHostname,
      avatar: avatarUrl,
    };
  }
}

export const createPostServiceTumbler = () => {};

export const tumblrService = new TumblrService();
