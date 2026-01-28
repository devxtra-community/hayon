import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import { AtpAgent } from "@atproto/api";
import { PLATFORM_CONSTRAINTS } from "@hayon/schemas";

const constraints = PLATFORM_CONSTRAINTS.bluesky;

// ============================================================================
// BLUESKY POSTING SERVICE
// ============================================================================

export class BlueskyPostingService extends BasePostingService {
  constructor() {
    super("bluesky");
  }

  // ============================================================================
  // VALIDATE CONTENT
  // ============================================================================

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text.length > constraints.maxChars) {
      return `Text exceeds ${constraints.maxChars} character limit`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > constraints.maxImages) {
      return `Maximum ${constraints.maxImages} images allowed`;
    }

    return null;
  }

  // ============================================================================
  // UPLOAD MEDIA
  // ============================================================================

  private agent: AtpAgent | null = null;

  private async getAgent(userId: string, credentials: any): Promise<AtpAgent> {
    if (this.agent) return this.agent;

    this.agent = new AtpAgent({
      service: "https://bsky.social",
      persistSession: async (evt, session) => {
        if (session) {
          console.log("🔄 Bluesky session updated, saving to DB...");
          // Update credentials object so subsequent calls in same execution use new tokens
          if (credentials.auth) {
            credentials.auth.accessJwt = session.accessJwt;
            credentials.auth.refreshJwt = session.refreshJwt;
          }

          try {
            // Import dynamically or use the model directly to avoid circular deps if they exist
            const SocialAccountModel = (await import("../../models/socialAccount.model")).default;
            await SocialAccountModel.updateOne(
              { userId },
              {
                $set: {
                  "bluesky.auth.accessJwt": session.accessJwt,
                  "bluesky.auth.refreshJwt": session.refreshJwt,
                  "bluesky.health.lastSuccessfulRefresh": new Date(),
                  "bluesky.health.status": "active",
                },
              },
            );
            console.log("✅ Bluesky session saved to DB");
          } catch (err) {
            console.error("❌ Failed to save Bluesky session:", err);
          }
        }
      },
    });

    const session = {
      did: credentials.did,
      handle: credentials.handle,
      accessJwt: credentials.auth.accessJwt,
      refreshJwt: credentials.auth.refreshJwt,
      active: true,
    };

    await this.agent.resumeSession(session);
    return this.agent;
  }

  async uploadMedia(
    mediaUrls: string[],
    credentials: any,
    payload: PostQueueMessage,
  ): Promise<any[]> {
    const agent = await this.getAgent(payload.userId, credentials);

    const blobs = [];
    for (const url of mediaUrls) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get("content-type") || "image/jpeg";

        // Bluesky has a strict ~1MB limit (976.56KB)
        const maxFileSize = constraints.maxFileSize || 1_000_000;
        if (buffer.length > maxFileSize) {
          const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
          const limitMB = (maxFileSize / (1024 * 1024)).toFixed(2);
          throw new Error(
            `Media file too large for Bluesky (${sizeMB}MB). Max allowed is ${limitMB}MB.`,
          );
        }

        const { data } = await agent.uploadBlob(buffer, { encoding: mimeType });
        blobs.push(data.blob);
      } catch (error: any) {
        if (error.message?.includes("too large") || error.error === "BlobTooLarge") {
          throw error; // Let handleError handle it if it's already mapped
        }
        console.error(`Error uploading media to Bluesky: ${error}`);
        throw error;
      }
    }
    return blobs;
  }

  // ============================================================================
  // CREATE POST
  // ============================================================================

  async createPost(
    payload: PostQueueMessage,
    credentials: any,
    mediaBlobs: any[],
  ): Promise<PostResult> {
    try {
      console.log("mediaBlobs :::", mediaBlobs);
      const agent = await this.getAgent(payload.userId, credentials);

      // Detect facets (links, mentions, hashtags)
      // Note: Since we don't have RichText class imported, we'll use a simplified version
      // or assume facets are handled elsewhere. For now, let's keep it simple.

      const postRecord: any = {
        $type: "app.bsky.feed.post",
        text: payload.content.text,
        createdAt: new Date().toISOString(),
      };

      if (mediaBlobs.length > 0) {
        postRecord.embed = {
          $type: "app.bsky.embed.images",
          images: mediaBlobs.map((blob) => ({
            alt: "", // Could be passed from payload in future
            image: blob,
          })),
        };
      }

      const data = await agent.post(postRecord);

      const postUrl = `https://bsky.app/profile/${credentials.handle}/post/${data.uri.split("/").pop()}`;

      return {
        success: true,
        platformPostId: data.uri,
        platformPostUrl: postUrl,
      };
    } catch (error: any) {
      console.error("Bluesky post creation failed:", error);
      return this.handleError(error);
    }
  }
}
