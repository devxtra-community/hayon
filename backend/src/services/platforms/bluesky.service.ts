import { AtpAgent, AtpSessionData } from "@atproto/api";

interface BlueskySession extends AtpSessionData {
  did: string;
}

export class BlueskyService {
  private createAgent() {
    return new AtpAgent({
      service: "https://bsky.social",
    });
  }

  async login(identifier: string, appPassword: string) {
    const agent = this.createAgent();

    const session = await agent.login({
      identifier,
      password: appPassword,
    });

    const profileRes = await agent.api.app.bsky.actor.getProfile({
      actor: session.data.did,
    });

    return {
      session: session.data,
      profile: profileRes.data,
    };
  }
  async getProfile(session: BlueskySession) {
    const agent = this.createAgent();
    await agent.resumeSession(session);

    const profileRes = await agent.api.app.bsky.actor.getProfile({
      actor: session.did,
    });

    return profileRes.data;
  }

  async resumeSession(sessionData: BlueskySession) {
    const agent = this.createAgent();
    await agent.resumeSession(sessionData);

    const profileRes = await agent.api.app.bsky.actor.getProfile({
      actor: agent.session?.did || sessionData.did,
    });

    return {
      session: agent.session,
      profile: profileRes.data,
    };
  }
}

export const createPostServiceBluesky = (payload: any) => {
  console.log("Creating post on Bluesky...");

  console.log(`Post content: ${JSON.stringify(payload.content)}`);
};

export const blueskyService = new BlueskyService();
