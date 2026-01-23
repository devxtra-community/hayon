// ============================================================================
// THREADS POSTING SERVICE - SKELETON WITH TODO COMMENTS
// ============================================================================
// File: src/services/posting/threads.posting.service.ts
// Purpose: Post content to Threads (Meta)
// ============================================================================

import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";

// ============================================================================
// THREADS API SPECIFICS
// ============================================================================

/*
 * Threads API is similar to Instagram but simpler:
 * - Uses same container-based publishing pattern
 * - Text-only posts are allowed (unlike Instagram)
 * - 500 character limit
 * - Up to 20 images or 1 video
 * 
 * API Docs: https://developers.facebook.com/docs/threads/posts
 * 
 * Key difference from Instagram:
 * - Threads allows text-only posts
 * - Threads uses Threads User ID, not IG User ID
 */

// ============================================================================
// CONSTRAINTS
// ============================================================================

const THREADS_CONSTRAINTS = {
    MAX_CHARS: 500,
    MAX_IMAGES: 20,
    MAX_VIDEO_DURATION: 300,  // 5 minutes
    SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    SUPPORTED_VIDEO_TYPES: ["video/mp4", "video/quicktime"]
};

// ============================================================================
// THREADS POSTING SERVICE
// ============================================================================

export class ThreadsPostingService extends BasePostingService {
    private graphApiUrl = "https://graph.threads.net";

    constructor() {
        super("threads");
    }

    async validateContent(payload: PostQueueMessage): Promise<string | null> {
        // if (payload.content.text.length > THREADS_CONSTRAINTS.MAX_CHARS) {
        //   return `Text exceeds ${THREADS_CONSTRAINTS.MAX_CHARS} character limit`;
        // }
        // 
        // const mediaCount = payload.content.mediaUrls?.length || 0;
        // if (mediaCount > THREADS_CONSTRAINTS.MAX_IMAGES) {
        //   return `Maximum ${THREADS_CONSTRAINTS.MAX_IMAGES} media items allowed`;
        // }

        return null;
    }

    async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
        // Like Instagram, Threads uses public URLs
        return mediaUrls;
    }

    // ============================================================================
    // CREATE POST
    // ============================================================================

    /*
     * TODO: Implement Threads posting
     * 
     * Flow for TEXT-ONLY:
     * 1. POST /{threads-user-id}/threads
     *    - media_type: TEXT
     *    - text: content
     *    Returns: container_id
     * 
     * 2. POST /{threads-user-id}/threads_publish
     *    - creation_id: container_id
     *    Returns: thread_id
     * 
     * Flow for SINGLE IMAGE:
     * 1. POST /{threads-user-id}/threads
     *    - media_type: IMAGE
     *    - image_url: public URL
     *    - text: caption (optional)
     *    Returns: container_id
     * 
     * 2. POST /{threads-user-id}/threads_publish
     *    - creation_id: container_id
     * 
     * Flow for CAROUSEL:
     * 1. Create item containers for each media
     *    POST /{threads-user-id}/threads
     *    - media_type: IMAGE (or VIDEO)
     *    - image_url (or video_url)
     *    - is_carousel_item: true
     * 
     * 2. Create carousel container
     *    POST /{threads-user-id}/threads
     *    - media_type: CAROUSEL
     *    - children: [container_ids...]
     *    - text: caption
     * 
     * 3. Publish
     *    POST /{threads-user-id}/threads_publish
     */

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaUrls: string[]
    ): Promise<PostResult> {
        const { threadsUserId, accessToken } = credentials;
        const axios = require('axios');
        const hasMedia = mediaUrls.length > 0;

        try {
            let containerId: string;

            if (!hasMedia) {
                // Text-only post
                containerId = await this.createThreadsContainer(threadsUserId, accessToken, {
                    media_type: "TEXT",
                    text: payload.content.text
                });
            } else if (mediaUrls.length === 1) {
                const isVideo = mediaUrls[0].toLowerCase().match(/\.(mp4|mov)$/);
                containerId = await this.createThreadsContainer(threadsUserId, accessToken, {
                    media_type: isVideo ? "VIDEO" : "IMAGE",
                    [isVideo ? "video_url" : "image_url"]: mediaUrls[0],
                    text: payload.content.text
                });
            } else {
                // Carousel
                containerId = await this.createThreadsCarousel(threadsUserId, accessToken, {
                    mediaUrls,
                    text: payload.content.text
                });
            }

            // Threads also needs a wait for video processing if applicable
            // For now, simple publish
            const publishResponse = await axios.post(
                `${this.graphApiUrl}/${threadsUserId}/threads_publish`,
                {
                    creation_id: containerId,
                    access_token: accessToken
                }
            );

            return {
                success: true,
                platformPostId: publishResponse.data.id,
                platformPostUrl: `https://threads.net/t/${publishResponse.data.id}`
            };
        } catch (error: any) {
            console.error("Threads post creation failed:", error.response?.data || error.message);
            return this.handleError(error);
        }
    }

    private async createThreadsContainer(threadsUserId: string, accessToken: string, data: any): Promise<string> {
        const axios = require('axios');
        const response = await axios.post(`${this.graphApiUrl}/${threadsUserId}/threads`, {
            ...data,
            access_token: accessToken
        });
        return response.data.id;
    }

    private async createThreadsCarousel(threadsUserId: string, accessToken: string, { mediaUrls, text }: any): Promise<string> {
        const axios = require('axios');
        const childIds: string[] = [];

        for (const url of mediaUrls) {
            const isVideo = url.toLowerCase().match(/\.(mp4|mov)$/);
            const res = await axios.post(`${this.graphApiUrl}/${threadsUserId}/threads`, {
                media_type: isVideo ? "VIDEO" : "IMAGE",
                [isVideo ? "video_url" : "image_url"]: url,
                is_carousel_item: true,
                access_token: accessToken
            });
            childIds.push(res.data.id);
        }

        const response = await axios.post(`${this.graphApiUrl}/${threadsUserId}/threads`, {
            media_type: "CAROUSEL",
            children: childIds,
            text: text,
            access_token: accessToken
        });
        return response.data.id;
    }
}

// ============================================================================
// CREDENTIALS STRUCTURE
// ============================================================================

/*
 * ThreadsCredentials - From SocialAccountModel:
 * 
 * interface ThreadsCredentials {
 *   threadsUserId: string;  // socialAccount.threads.platformId
 *   accessToken: string;    // socialAccount.threads.auth.accessToken
 * }
 */
