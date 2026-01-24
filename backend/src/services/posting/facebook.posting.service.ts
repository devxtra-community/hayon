// ============================================================================
// FACEBOOK POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/facebook.posting.service.ts
// Purpose: Post content to Facebook Pages via Graph API
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";

// ============================================================================
// FACEBOOK API SPECIFICS
// ============================================================================

/*
 * Facebook posting via Graph API:
 * - Posts to Facebook PAGES (not personal profiles!)
 * - Uses Page Access Token (long-lived)
 * - Simpler than Instagram - direct posting
 * - Can post text-only, with photos, or with videos
 * 
 * API Docs: https://developers.facebook.com/docs/pages-api/posts
 * 
 * IMPORTANT: We post to the PAGE, not the user profile.
 * The pageId and pageAccessToken are stored in SocialAccountModel.
 */

// ============================================================================
// CONSTRAINTS
// ============================================================================

const FACEBOOK_CONSTRAINTS = {
    MAX_CHARS: 63206,       // Very generous
    MAX_PHOTOS: 10,         // Per single post
    MAX_VIDEO_SIZE: 10_000_000_000,  // 10GB
    MAX_VIDEO_DURATION: 14400  // 4 hours
};

// ============================================================================
// FACEBOOK POSTING SERVICE
// ============================================================================

export class FacebookPostingService extends BasePostingService {
    private graphApiUrl = "https://graph.facebook.com/v24.0";

    constructor() {
        super("facebook");
    }

    async validateContent(payload: PostQueueMessage): Promise<string | null> {
        // if (payload.content.text.length > FACEBOOK_CONSTRAINTS.MAX_CHARS) {
        //   return `Text exceeds ${FACEBOOK_CONSTRAINTS.MAX_CHARS} characters`;
        // }
        return null;
    }

    async uploadMedia(
        mediaUrls: string[],
        credentials: any,
        payload: PostQueueMessage
    ): Promise<string[]> {
        // Facebook can accept public URLs directly for photos
        // For multiple photos, need to upload each separately
        return mediaUrls;
    }

    // ============================================================================
    // CREATE POST
    // ============================================================================

    /*
     * TODO: Implement Facebook posting
     * 
     * TEXT-ONLY POST:
     * POST /{page-id}/feed
     * - message: text content
     * - access_token: page access token
     * Returns: { id: "PAGE_ID_POST_ID" }
     * 
     * SINGLE PHOTO POST:
     * POST /{page-id}/photos
     * - url: public image URL (or source: multipart)
     * - message: caption
     * - access_token: page access token
     * 
     * MULTIPLE PHOTOS POST (complex!):
     * 1. For each photo, POST /{page-id}/photos with published=false
     *    Returns: { id: photo_id }
     * 2. POST /{page-id}/feed with attached_media array
     *    - attached_media: [{ media_fbid: photo_id1 }, { media_fbid: photo_id2 }]
     *    - message: caption
     * 
     * VIDEO POST:
     * POST /{page-id}/videos
     * - file_url: public video URL
     * - description: caption
     * - access_token: page access token
     * 
     * Note: Videos are processed async, might need status check
     */

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaUrls: string[]
    ): Promise<PostResult> {
        const { pageId, accessToken } = credentials;
        const hasMedia = mediaUrls.length > 0;
        const axios = require('axios'); // Ensure axios is available

        try {
            if (!hasMedia) {
                // Text-only post
                const response = await axios.post(
                    `${this.graphApiUrl}/${pageId}/feed`,
                    {
                        message: payload.content.text,
                        access_token: accessToken
                    }
                );
                return {
                    success: true,
                    platformPostId: response.data.id,
                    platformPostUrl: `https://facebook.com/${response.data.id}`
                };
            } else if (mediaUrls.length === 1) {
                // Single photo
                const response = await axios.post(
                    `${this.graphApiUrl}/${pageId}/photos`,
                    {
                        url: mediaUrls[0],
                        message: payload.content.text,
                        access_token: accessToken
                    }
                );
                return {
                    success: true,
                    platformPostId: response.data.id,
                    platformPostUrl: `https://facebook.com/${response.data.id}`
                };
            } else {
                // Multiple photos (Carousel-like feed post)
                const photoIds: string[] = [];
                for (const url of mediaUrls) {
                    const photoRes = await axios.post(
                        `${this.graphApiUrl}/${pageId}/photos`,
                        {
                            url,
                            published: false,
                            access_token: accessToken
                        }
                    );
                    photoIds.push(photoRes.data.id);
                }

                const response = await axios.post(
                    `${this.graphApiUrl}/${pageId}/feed`,
                    {
                        message: payload.content.text,
                        attached_media: photoIds.map(id => ({ media_fbid: id })),
                        access_token: accessToken
                    }
                );

                return {
                    success: true,
                    platformPostId: response.data.id,
                    platformPostUrl: `https://facebook.com/${response.data.id}`
                };
            }
        } catch (error: any) {
            console.error("Facebook post creation failed:", error.response?.data || error.message);
            return this.handleError(error);
        }
    }
}

// ============================================================================
// CREDENTIALS STRUCTURE  
// ============================================================================

/*
 * FacebookCredentials - From SocialAccountModel:
 *
 * interface FacebookCredentials {
 *   pageId: string;      // socialAccount.facebook.platformId
 *   accessToken: string; // socialAccount.facebook.auth.accessToken (page token)
 * }
 *
 * IMPORTANT: The access token should be a PAGE access token,
 * not a user access token. This was obtained during OAuth flow.
 */

// ============================================================================
// EDGE CASES
// ============================================================================

/*
 * 1. Page Token Expiry:
 *    - Long-lived page tokens last ~60 days
 *    - Need refresh mechanism before expiry
 *    - health.status in SocialAccountModel tracks this
 * 
 * 2. Multiple Photos:
 *    - Facebook's multi-photo flow is complex
 *    - Must upload each with published=false first
 *    - Then create post with attached_media array
 * 
 * 3. Link Posts:
 *    - To share a link with preview:
 *    - POST /{page-id}/feed with link: URL
 *    - Facebook auto-generates preview
 * 
 * 4. Scheduled Posts (native):
 *    - Facebook supports native scheduling
 *    - Add scheduled_publish_time to post
 *    - published: false
 *    - We use RabbitMQ instead for consistency
 */
