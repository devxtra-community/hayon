// ============================================================================
// BLUESKY POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/bluesky.posting.service.ts
// Purpose: Post content to Bluesky/AT Protocol
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import { AtpAgent } from "@atproto/api";

// ============================================================================
// BLUESKY API SPECIFICS
// ============================================================================

/*
 * Bluesky uses the AT Protocol (atproto):
 * - Session-based authentication (JWT tokens)
 * - Media upload via blob API before posting
 * - 300 character limit
 * - Max 4 images per post
 * - Rich text with facets for mentions/links/hashtags
 * 
 * API Docs: https://docs.bsky.app/docs/api/
 * 
 * Key endpoints:
 * - com.atproto.repo.createRecord - Create post
 * - com.atproto.repo.uploadBlob - Upload media
 */

// ============================================================================
// CONSTRAINTS
// ============================================================================

const BLUESKY_CONSTRAINTS = {
  MAX_CHARS: 300,
  MAX_IMAGES: 4,
  MAX_IMAGE_SIZE: 1_000_000,  // 1MB
  SUPPORTED_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"]
};

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

  /*
   * TODO: Implement validation
   * 
   * Checks:
   * - Text length <= 300 chars
   * - Image count <= 4
   * - Image types are supported
   * - Image sizes within limit
   */

  async validateContent(payload: PostQueueMessage): Promise<string | null> {
    if (payload.content.text.length > BLUESKY_CONSTRAINTS.MAX_CHARS) {
      return `Text exceeds ${BLUESKY_CONSTRAINTS.MAX_CHARS} character limit`;
    }

    const mediaCount = payload.content.mediaUrls?.length || 0;
    if (mediaCount > BLUESKY_CONSTRAINTS.MAX_IMAGES) {
      return `Maximum ${BLUESKY_CONSTRAINTS.MAX_IMAGES} images allowed`;
    }

    return null;

    // return null;
  }

  // ============================================================================
  // UPLOAD MEDIA
  // ============================================================================

  /*
   * TODO: Implement media upload
   * 
   * Bluesky media upload flow:
   * 1. Download image from S3 URL
   * 2. Call agent.uploadBlob() with image buffer
   * 3. Store returned blob reference for post creation
   * 
   * Returns: Array of blob references (not IDs - Bluesky uses blob objects)
   * 
   * Code outline:
   * async uploadMedia(mediaUrls: string[], credentials: BlueskyCredentials): Promise<any[]> {
   *   const agent = new AtpAgent({ service: "https://bsky.social" });
   *   await agent.resumeSession(credentials.session);
   *   
   *   const blobs = [];
   *   for (const url of mediaUrls) {
   *     // Download from S3
   *     const response = await axios.get(url, { responseType: "arraybuffer" });
   *     const buffer = Buffer.from(response.data);
   *     const mimeType = response.headers["content-type"];
   *     
   *     // Upload to Bluesky
   *     const { data } = await agent.uploadBlob(buffer, { encoding: mimeType });
   *     blobs.push(data.blob);
   *   }
   *   return blobs;
   * }
   */

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
                  "bluesky.health.status": "active"
                }
              }
            );
            console.log("✅ Bluesky session saved to DB");
          } catch (err) {
            console.error("❌ Failed to save Bluesky session:", err);
          }
        }
      }
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

  async uploadMedia(mediaUrls: string[], credentials: any, payload: PostQueueMessage): Promise<any[]> {
    const agent = await this.getAgent(payload.userId, credentials);

    const blobs = [];
    for (const url of mediaUrls) {
      try {
        // Download from S3 (assuming url is a signed URL or public URL)
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get("content-type") || "image/jpeg";

        // Upload to Bluesky
        const { data } = await agent.uploadBlob(buffer, { encoding: mimeType });
        blobs.push(data.blob);
      } catch (error) {
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
    mediaBlobs: any[]
  ): Promise<PostResult> {
    try {
      console.log("mediaBlobs :::", mediaBlobs)
      const agent = await this.getAgent(payload.userId, credentials);

      // Detect facets (links, mentions, hashtags)
      // Note: Since we don't have RichText class imported, we'll use a simplified version
      // or assume facets are handled elsewhere. For now, let's keep it simple.

      const postRecord: any = {
        $type: "app.bsky.feed.post",
        text: payload.content.text,
        createdAt: new Date().toISOString()
      };

      if (mediaBlobs.length > 0) {
        postRecord.embed = {
          $type: "app.bsky.embed.images",
          images: mediaBlobs.map(blob => ({
            alt: "", // Could be passed from payload in future
            image: blob
          }))
        };
      }

      const data = await agent.post(postRecord);

      const postUrl = `https://bsky.app/profile/${credentials.handle}/post/${data.uri.split('/').pop()}`;

      return {
        success: true,
        platformPostId: data.uri,
        platformPostUrl: postUrl
      };
    } catch (error: any) {
      console.error("Bluesky post creation failed:", error);
      return this.handleError(error);
    }
  }
}

// ============================================================================
// CREDENTIALS STRUCTURE
// ============================================================================

/*
 * BlueskyCredentials - Fetch from SocialAccountModel:
 *
 * interface BlueskyCredentials {
 *   session: {
 *     did: string;
 *     handle: string;
 *     accessJwt: string;
 *     refreshJwt: string;
 *   };
 *   handle: string;
 * }
 *
 * Fetching credentials in worker:
 * const socialAccount = await SocialAccountModel.findOne({ userId });
 * const credentials = {
 *   session: {
 *     did: socialAccount.bluesky.did,
 *     handle: socialAccount.bluesky.handle,
 *     accessJwt: socialAccount.bluesky.auth.accessJwt,
 *     refreshJwt: socialAccount.bluesky.auth.refreshJwt
 *   },
 *   handle: socialAccount.bluesky.handle
 * };
 */

// ============================================================================
// EDGE CASES
// ============================================================================

/*
 * 1. Session expiry:
 *    - Bluesky JWTs expire after ~2 hours
 *    - Use refreshSession() if 401 error
 *    - Update stored tokens after refresh
 * 
 * 2. Hashtag handling:
 *    - Bluesky facets need byte positions, not character positions
 *    - Use TextEncoder to get byte ranges
 * 
 * 3. Link cards:
 *    - To show link preview, use external embed
 *    - Requires fetching OG metadata (thumb, title, description)
 * 
 * 4. Reply/Quote posts:
 *    - Not needed for MVP but structure exists
 *    - Would need parent reference in post record
 */
