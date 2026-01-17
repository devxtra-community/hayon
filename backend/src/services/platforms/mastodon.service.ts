import axios from "axios";
import { ENV } from "../../config/env";

export class MastodonService {
  private instanceUrl = ENV.MASTODON.INSTANCE_URL;

  public getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: ENV.MASTODON.CLIENT_KEY,
      redirect_uri: ENV.MASTODON.CALLBACK_URL,
      scope: "read write push",
      state: state,
    });

    return `${this.instanceUrl}/oauth/authorize?${params.toString()}`;
  }

  public async getAccessToken(code: string): Promise<string> {
    const response = await axios.post(`${this.instanceUrl}/oauth/token`, {
      grant_type: "authorization_code",
      code,
      client_id: ENV.MASTODON.CLIENT_KEY,
      client_secret: ENV.MASTODON.CLIENT_SECRET,
      redirect_uri: ENV.MASTODON.CALLBACK_URL,
    });

    return response.data.access_token;
  }

  public async getUserProfile(accessToken: string) {
    const response = await axios.get(`${this.instanceUrl}/api/v1/accounts/verify_credentials`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }
}

export const createPostServiceMastodon = () => {};

export const mastodonService = new MastodonService();
