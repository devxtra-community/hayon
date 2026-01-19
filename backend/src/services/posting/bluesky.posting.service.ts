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
        // if (payload.content.text.length > BLUESKY_CONSTRAINTS.MAX_CHARS) {
        //   return `Text exceeds ${BLUESKY_CONSTRAINTS.MAX_CHARS} character limit`;
        // }
        // 
        // const mediaCount = payload.content.mediaUrls?.length || 0;
        // if (mediaCount > BLUESKY_CONSTRAINTS.MAX_IMAGES) {
        //   return `Maximum ${BLUESKY_CONSTRAINTS.MAX_IMAGES} images allowed`;
        // }
        // 
        // return null;

        return null;
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

    async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
        // TODO: Implement - returns blob references
        return [];
    }

    // ============================================================================
    // CREATE POST
    // ============================================================================

    /*
     * TODO: Implement post creation
     * 
     * Bluesky post structure:
     * {
     *   $type: "app.bsky.feed.post",
     *   text: "Hello world!",
     *   createdAt: new Date().toISOString(),
     *   embed?: {
     *     $type: "app.bsky.embed.images",
     *     images: [{ alt: "", image: blobRef }]
     *   },
     *   facets?: [...] // For mentions, links, hashtags
     * }
     * 
     * IMPORTANT: Facets for rich text
     * - Bluesky requires explicit byte ranges for links/mentions
     * - Use detectFacets() helper or parse manually
     * - Links: { $type: "app.bsky.richtext.facet#link", uri: "..." }
     * - Mentions: { $type: "app.bsky.richtext.facet#mention", did: "..." }
     * - Hashtags: { $type: "app.bsky.richtext.facet#tag", tag: "..." }
     */

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaBlobs: any[]
    ): Promise<PostResult> {
        // TODO: Implement actual Bluesky posting

        // try {
        //   const agent = new AtpAgent({ service: "https://bsky.social" });
        //   await agent.resumeSession(credentials.session);
        //   
        //   // Build post record
        //   const postRecord: any = {
        //     $type: "app.bsky.feed.post",
        //     text: payload.content.text,
        //     createdAt: new Date().toISOString()
        //   };
        //   
        //   // Add images embed if media exists
        //   if (mediaBlobs.length > 0) {
        //     postRecord.embed = {
        //       $type: "app.bsky.embed.images",
        //       images: mediaBlobs.map(blob => ({
        //         alt: "", // TODO: Add alt text support
        //         image: blob
        //       }))
        //     };
        //   }
        //   
        //   // Detect and add facets (links, mentions, hashtags)
        //   // const rt = new RichText({ text: payload.content.text });
        //   // await rt.detectFacets(agent);
        //   // postRecord.facets = rt.facets;
        //   
        //   // Create the post
        //   const { data } = await agent.post(postRecord);
        //   
        //   // Construct post URL
        //   const postUrl = `https://bsky.app/profile/${credentials.handle}/post/${data.uri.split('/').pop()}`;
        //   
        //   return {
        //     success: true,
        //     platformPostId: data.uri,
        //     platformPostUrl: postUrl
        //   };
        // } catch (error: any) {
        //   return this.handleError(error);
        // }

        console.log(`[STUB] Would post to Bluesky: ${payload.content.text.substring(0, 50)}...`);
        return { success: false, error: "Not implemented" };
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
