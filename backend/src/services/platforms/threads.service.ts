import axios from "axios";
import { ENV } from "../../config/env";

const THREADS_GRAPH_URL = "https://graph.threads.net";

export class ThreadsService {
  async getThreadsShortLivedToken(code: string): Promise<{ accessToken: string; userId: string }> {
    const redirectUri = ENV.THREADS.REDIRECT_URI;

    const formData = new URLSearchParams();
    formData.append("client_id", ENV.THREADS.APP_ID);
    formData.append("client_secret", ENV.THREADS.APP_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("redirect_uri", redirectUri);
    formData.append("code", code);

    const response = await axios.post(`${THREADS_GRAPH_URL}/oauth/access_token`, formData);
    return {
      accessToken: response.data.access_token,
      userId: response.data.user_id,
    };
  }

  async getThreadsLongLivedToken(shortToken: string): Promise<string> {
    const response = await axios.get(`${THREADS_GRAPH_URL}/access_token`, {
      params: {
        grant_type: "th_exchange_token",
        client_secret: ENV.THREADS.APP_SECRET,
        access_token: shortToken,
      },
    });
    return response.data.access_token;
  }

  async getThreadsUserProfile(accessToken: string) {
    const response = await axios.get(`${THREADS_GRAPH_URL}/me`, {
      params: {
        fields: "id,username,name,threads_profile_picture_url",
        access_token: accessToken,
      },
    });
    return response.data;
  }
}

export const threadsService = new ThreadsService();
