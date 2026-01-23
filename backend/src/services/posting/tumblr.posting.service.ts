// ============================================================================
// TUMBLR POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/tumblr.posting.service.ts
// Purpose: Post content to Tumblr blogs
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";

// ============================================================================
// TUMBLR API SPECIFICS
// ============================================================================

/*
 * Tumblr uses OAuth 1.0a (not OAuth 2.0!):
 * - Requires signing each request
 * - Uses oauth_token and oauth_token_secret
 * - Similar pattern to old Twitter API
 * 
 * API Docs: https://www.tumblr.com/docs/en/api/v2
 * 
 * Endpoint: POST /v2/blog/{blog-identifier}/post
 * 
 * Post Types:
 * - text: Text/HTML content
 * - photo: Image posts
 * - video: Video posts
 * - link: Link sharing
 * - audio: Audio posts
 * - chat: Chat/dialogue format
 * 
 * IMPORTANT: Use existing tumblrOAuth utility for signing!
 */

// ============================================================================
// CONSTRAINTS
// ============================================================================

const TUMBLR_CONSTRAINTS = {
    MAX_CHARS: 4096,
    MAX_PHOTOS: 10,
    MAX_PHOTO_SIZE: 20_000_000,  // 20MB
    MAX_VIDEO_SIZE: 500_000_000, // 500MB
    MAX_VIDEO_DURATION: 600      // 10 minutes
};

// ============================================================================
// TUMBLR POSTING SERVICE
// ============================================================================

export class TumblrPostingService extends BasePostingService {
    private apiUrl = "https://api.tumblr.com/v2";

    constructor() {
        super("tumblr");
    }

    async validateContent(payload: PostQueueMessage): Promise<string | null> {
        // if (payload.content.text.length > TUMBLR_CONSTRAINTS.MAX_CHARS) {
        //   return `Text exceeds ${TUMBLR_CONSTRAINTS.MAX_CHARS} characters`;
        // }
        // 
        // const mediaCount = payload.content.mediaUrls?.length || 0;
        // if (mediaCount > TUMBLR_CONSTRAINTS.MAX_PHOTOS) {
        //   return `Maximum ${TUMBLR_CONSTRAINTS.MAX_PHOTOS} photos allowed`;
        // }

        return null;
    }

    async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
        // Tumblr accepts URLs directly in the post request
        // No pre-upload needed
        return mediaUrls;
    }

    // ============================================================================
    // CREATE POST
    // ============================================================================

    /*
     * TODO: Implement Tumblr posting
     * 
     * Endpoint: POST /v2/blog/{blog-identifier}/post
     * 
     * For NPF (Neue Post Format) - recommended:
     * Body:
     * {
     *   content: [
     *     { type: "text", text: "Hello world!", formatting: [...] },
     *     { type: "image", media: [{ url: "..." }] }
     *   ],
     *   tags: "tag1,tag2"
     * }
     * 
     * For Legacy (simpler):
     * Body:
     * {
     *   type: "text",
     *   body: "<p>HTML content</p>",
     *   tags: "tag1,tag2"
     * }
     * 
     * For Photo Post:
     * {
     *   type: "photo",
     *   caption: "Caption text",
     *   source: "https://url-to-image",  // OR data: base64
     *   tags: "tag1,tag2"
     * }
     * 
     * Returns: { meta: { status: 201 }, response: { id: "post_id" } }
     * 
     * OAuth 1.0a Signing:
     * - Use tumblrOAuth from utils/tumblrOAuth
     * - Sign request with consumer key/secret + oauth token/secret
     */

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaUrls: string[]
    ): Promise<PostResult> {
        const { blogHostname, oauthToken, oauthTokenSecret } = credentials;
        const axios = require('axios');
        const { tumblrOAuth } = require("../../utils/tumblrOAuth");

        try {
            const hasMedia = mediaUrls.length > 0;

            const requestData = {
                url: `${this.apiUrl}/blog/${blogHostname}/post`,
                method: "POST",
                data: hasMedia ? {
                    type: "photo",
                    caption: payload.content.text,
                    source: mediaUrls[0] // For single photo
                    // For multiple photos, use source[0], source[1] according to legacy API
                } : {
                    type: "text",
                    body: payload.content.text
                }
            };

            // Sign request with OAuth
            const headers = tumblrOAuth.toHeader(
                tumblrOAuth.authorize(requestData, {
                    key: oauthToken,
                    secret: oauthTokenSecret
                })
            );

            const response = await axios.post(
                requestData.url,
                requestData.data,
                { headers }
            );

            const postId = response.data.response.id;
            return {
                success: true,
                platformPostId: postId.toString(),
                platformPostUrl: `https://${blogHostname}.tumblr.com/post/${postId}`
            };
        } catch (error: any) {
            console.error("Tumblr post creation failed:", error.response?.data || error.message);
            return this.handleError(error);
        }
    }
}

// ============================================================================
// CREDENTIALS STRUCTURE
// ============================================================================

/*
 * TumblrCredentials - From SocialAccountModel:
 *
 * interface TumblrCredentials {
 *   blogHostname: string;     // socialAccount.tumblr.blogHostname
 *   oauthToken: string;       // socialAccount.tumblr.auth.oauthToken
 *   oauthTokenSecret: string; // socialAccount.tumblr.auth.oauthTokenSecret
 * }
 *
 * Note: Tumblr uses OAuth 1.0a, so we have token + secret pair
 */

// ============================================================================
// EDGE CASES
// ============================================================================

/*
 * 1. Multiple Blogs:
 *    - Users can have multiple Tumblr blogs
 *    - Currently storing primary blog only
 *    - Could add blog selection in UI
 * 
 * 2. NPF vs Legacy:
 *    - NPF (Neue Post Format) is more flexible
 *    - Legacy format is simpler but limited
 *    - Start with legacy, migrate to NPF for rich content
 * 
 * 3. Multiple Photos:
 *    - Use source0, source1, etc. for multiple
 *    - Or use data0, data1 for base64
 *    - Consider photoset layout options
 * 
 * 4. HTML Content:
 *    - Tumblr text posts support HTML
 *    - Could convert markdown to HTML
 *    - Sanitize user input!
 * 
 * 5. Tags:
 *    - Tumblr has extensive tagging culture
 *    - Extract hashtags from text → tags field
 *    - Comma-separated string
 */
