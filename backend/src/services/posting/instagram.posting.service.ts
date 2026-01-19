// ============================================================================
// INSTAGRAM POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/instagram.posting.service.ts
// Purpose: Post content to Instagram via Graph API
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";

// ============================================================================
// INSTAGRAM API SPECIFICS - IMPORTANT!
// ============================================================================

/*
 * Instagram posting via Graph API is COMPLEX:
 * 
 * 1. Only works for Instagram Business/Creator accounts
 * 2. Account MUST be linked to a Facebook Page
 * 3. Uses a 2-step process: Create Container → Publish Container
 * 4. Media MUST be hosted on a public URL (not local upload)
 * 5. Video posts have additional requirements (transcoding time)
 * 
 * API Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing
 * 
 * CRITICAL: Instagram requires images be publicly accessible URLs!
 * Your S3 bucket must have public read access OR use signed URLs with long expiry.
 */

// ============================================================================
// CONSTRAINTS
// ============================================================================

const INSTAGRAM_CONSTRAINTS = {
    MAX_CAPTION_CHARS: 2200,
    MAX_HASHTAGS: 30,
    MAX_IMAGES_CAROUSEL: 10,
    MIN_IMAGE_WIDTH: 320,
    MAX_IMAGE_WIDTH: 1440,
    ASPECT_RATIO_MIN: 0.8,   // 4:5
    ASPECT_RATIO_MAX: 1.91,  // 1.91:1
    SUPPORTED_TYPES: ["image/jpeg", "image/png"],
    MAX_VIDEO_DURATION: 60,  // seconds for feed
    MAX_VIDEO_SIZE: 100_000_000  // 100MB
};

// ============================================================================
// INSTAGRAM POSTING SERVICE
// ============================================================================

export class InstagramPostingService extends BasePostingService {
    private graphApiUrl = "https://graph.facebook.com/v24.0";

    constructor() {
        super("instagram");
    }

    // ============================================================================
    // VALIDATE CONTENT
    // ============================================================================

    async validateContent(payload: PostQueueMessage): Promise<string | null> {
        // Instagram REQUIRES at least one image/video
        // if (!payload.content.mediaUrls || payload.content.mediaUrls.length === 0) {
        //   return "Instagram requires at least one image or video";
        // }
        // 
        // if (payload.content.text.length > INSTAGRAM_CONSTRAINTS.MAX_CAPTION_CHARS) {
        //   return `Caption exceeds ${INSTAGRAM_CONSTRAINTS.MAX_CAPTION_CHARS} character limit`;
        // }
        // 
        // // Count hashtags
        // const hashtagCount = (payload.content.text.match(/#\w+/g) || []).length;
        // if (hashtagCount > INSTAGRAM_CONSTRAINTS.MAX_HASHTAGS) {
        //   return `Maximum ${INSTAGRAM_CONSTRAINTS.MAX_HASHTAGS} hashtags allowed`;
        // }

        return null;
    }

    // ============================================================================
    // UPLOAD MEDIA - NOT STANDARD FOR INSTAGRAM!
    // ============================================================================

    /*
     * Instagram doesn't use traditional media upload!
     * 
     * Instead, you provide a PUBLIC URL to the media:
     * - Single image: image_url parameter
     * - Single video: video_url parameter
     * - Carousel: array of item containers with media URLs
     * 
     * S3 CONSIDERATIONS:
     * - Option A: Make bucket public (security concern)
     * - Option B: Generate pre-signed URLs with long expiry (1 hour+)
     * - Option C: Use CloudFront with signed URLs
     * 
     * For this skeleton, we assume S3 URLs are publicly accessible.
     */

    async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
        // Instagram doesn't need pre-upload
        // Just return the URLs, they'll be used in container creation
        return mediaUrls;
    }

    // ============================================================================
    // CREATE POST - 2-STEP PROCESS
    // ============================================================================

    /*
     * TODO: Implement Instagram posting
     * 
     * Flow for SINGLE IMAGE:
     * 1. POST /{ig-user-id}/media
     *    - image_url: public URL
     *    - caption: text
     *    Returns: container_id
     * 
     * 2. POST /{ig-user-id}/media_publish
     *    - creation_id: container_id
     *    Returns: media_id (the actual post ID)
     * 
     * Flow for CAROUSEL (multiple images):
     * 1. Create container for EACH image:
     *    POST /{ig-user-id}/media
     *    - image_url: public URL
     *    - is_carousel_item: true
     *    Returns: item_container_id
     * 
     * 2. Create carousel container:
     *    POST /{ig-user-id}/media
     *    - media_type: CAROUSEL
     *    - children: [item_container_id1, item_container_id2, ...]
     *    - caption: text
     *    Returns: carousel_container_id
     * 
     * 3. Publish:
     *    POST /{ig-user-id}/media_publish
     *    - creation_id: carousel_container_id
     *    Returns: media_id
     * 
     * Flow for VIDEO (Reels):
     * 1. POST /{ig-user-id}/media
     *    - video_url: public URL
     *    - media_type: REELS
     *    - caption: text
     *    Returns: container_id
     * 
     * 2. WAIT for video to process! (check status)
     *    GET /{container_id}?fields=status_code
     *    Loop until status_code === "FINISHED"
     * 
     * 3. POST /{ig-user-id}/media_publish
     */

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaUrls: string[]
    ): Promise<PostResult> {
        // TODO: Implement based on flow above

        // const { igUserId, accessToken } = credentials;
        // const isSingleImage = mediaUrls.length === 1;
        // const isVideo = mediaUrls[0]?.includes(".mp4");
        // 
        // try {
        //   let containerId: string;
        //   
        //   if (isSingleImage && !isVideo) {
        //     // Single image flow
        //     containerId = await this.createImageContainer(igUserId, accessToken, {
        //       imageUrl: mediaUrls[0],
        //       caption: payload.content.text
        //     });
        //   } else if (mediaUrls.length > 1) {
        //     // Carousel flow
        //     containerId = await this.createCarouselContainer(igUserId, accessToken, {
        //       mediaUrls,
        //       caption: payload.content.text
        //     });
        //   } else if (isVideo) {
        //     // Video/Reels flow
        //     containerId = await this.createVideoContainer(igUserId, accessToken, {
        //       videoUrl: mediaUrls[0],
        //       caption: payload.content.text
        //     });
        //     // Wait for video processing
        //     await this.waitForContainerReady(containerId, accessToken);
        //   }
        //   
        //   // Publish the container
        //   const mediaId = await this.publishContainer(igUserId, accessToken, containerId);
        //   
        //   return {
        //     success: true,
        //     platformPostId: mediaId,
        //     platformPostUrl: `https://www.instagram.com/p/${mediaId}/`
        //   };
        // } catch (error: any) {
        //   return this.handleError(error);
        // }

        console.log(`[STUB] Would post to Instagram: ${mediaUrls.length} media items`);
        return { success: false, error: "Not implemented" };
    }

    // ============================================================================
    // HELPER METHODS - TO IMPLEMENT
    // ============================================================================

    /*
     * TODO: Implement these helper methods:
     * 
     * private async createImageContainer(igUserId, accessToken, { imageUrl, caption }): Promise<string>
     * private async createCarouselContainer(igUserId, accessToken, { mediaUrls, caption }): Promise<string>
     * private async createVideoContainer(igUserId, accessToken, { videoUrl, caption }): Promise<string>
     * private async waitForContainerReady(containerId, accessToken): Promise<void>
     * private async publishContainer(igUserId, accessToken, containerId): Promise<string>
     */
}

// ============================================================================
// CREDENTIALS STRUCTURE
// ============================================================================

/*
 * InstagramCredentials - From SocialAccountModel:
 *
 * interface InstagramCredentials {
 *   igUserId: string;    // socialAccount.instagram.platformId
 *   accessToken: string; // socialAccount.instagram.auth.accessToken
 *   linkedPageId: string; // For some API calls
 * }
 */

// ============================================================================
// EDGE CASES & WARNINGS
// ============================================================================

/*
 * 1. Media URL Accessibility:
 *    - Instagram fetches media from your URL
 *    - URLs must be publicly accessible
 *    - Consider: signed URLs expire - use long expiry (1+ hours)
 * 
 * 2. Rate Limits:
 *    - 25 API calls per user per hour for content publishing
 *    - Implement rate limit tracking and backoff
 * 
 * 3. Container Status:
 *    - Check container status before publishing
 *    - Possible statuses: IN_PROGRESS, FINISHED, ERROR
 *    - Videos take time to process!
 * 
 * 4. Aspect Ratio:
 *    - Instagram enforces aspect ratios
 *    - Consider pre-processing images to fit
 * 
 * 5. Business Account Required:
 *    - Personal accounts CANNOT use Content Publishing API
 *    - Must have Business or Creator account
 *    - Must be connected to Facebook Page
 * 
 * 6. Permissions:
 *    - Need: instagram_basic, instagram_content_publish
 *    - May need: pages_read_engagement if using Page token
 * 
 * 7. Hashtag First Comment:
 *    - Some users prefer hashtags in first comment
 *    - Would need separate comment API call after posting
 */
