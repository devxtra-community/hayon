import { AtpAgent } from "@atproto/api";

export const createBlueskyAgent = () => {
  return new AtpAgent({
    service: "https://bsky.social",
  });
};
