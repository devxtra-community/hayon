import { AtpAgent } from "@atproto/api";

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
}

export const blueskyService = new BlueskyService();
