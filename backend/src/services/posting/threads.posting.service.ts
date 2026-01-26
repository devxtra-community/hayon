import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import axios from "axios";
import { getPresignedDownloadUrl, extractS3Key } from "../s3/s3.upload";

// ============================================================================
// CONSTRAINTS
// ============================================================================

const THREADS_CONSTRAINTS = {
    MAX_CHARS: 500,
    MAX_IMAGES: 20,
};

// ============================================================================
// THREADS POSTING SERVICE
// ============================================================================

export class ThreadsPostingService extends BasePostingService {
    private graphApiUrl = "https://graph.threads.net/v1.0";

    constructor() {
        super("threads");
    }

    async validateContent(payload: PostQueueMessage): Promise<string | null> {
        if (payload.content.text.length > THREADS_CONSTRAINTS.MAX_CHARS) {
            return `Text exceeds ${THREADS_CONSTRAINTS.MAX_CHARS} character limit`;
        }

        const mediaCount = payload.content.mediaUrls?.length || 0;
        if (mediaCount > THREADS_CONSTRAINTS.MAX_IMAGES) {
            return `Maximum ${THREADS_CONSTRAINTS.MAX_IMAGES} media items allowed`;
        }

        return null;
    }

    async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
        // Threads Graph API MUST have a publicly accessible URL to fetch the media.
        // We convert our private S3 URLs into presigned download URLs (3 hour expiry).
        const presignedUrls = await Promise.all(
            mediaUrls.map(async (url) => {
                const s3Key = extractS3Key(url);
                return await getPresignedDownloadUrl(s3Key, 10800); // 3 hours
            })
        );
        return presignedUrls;
    }

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaUrls: string[]
    ): Promise<PostResult> {
        const { platformId: threadsUserId, auth } = credentials;
        const { accessToken } = auth;
        const hasMedia = mediaUrls && mediaUrls.length > 0;

        try {
            // 1. Create Media Container
            const containerParams: any = {
                access_token: accessToken,
                text: payload.content.text
            };

            if (!hasMedia) {
                containerParams.media_type = "TEXT";
            } else if (mediaUrls.length === 1) {
                const isVideo = mediaUrls[0].includes(".mp4") || mediaUrls[0].includes(".mov");
                containerParams.media_type = isVideo ? "VIDEO" : "IMAGE";
                if (isVideo) {
                    containerParams.video_url = mediaUrls[0];
                } else {
                    containerParams.image_url = mediaUrls[0];
                }
            } else {
                // Carousel logic (complex, requires item containers)
                // For now, let's focus on text/single media
                return { success: false, error: "Carousels not yet implemented for Threads" };
            }

            const containerResponse = await axios.post(
                `${this.graphApiUrl}/${threadsUserId}/threads`,
                null,
                { params: containerParams }
            );

            const containerId = containerResponse.data.id;

            // 2. Publish Container
            // Note: For videos, might need to wait for processing. 
            // For text/images, it's usually immediate.

            const publishResponse = await axios.post(
                `${this.graphApiUrl}/${threadsUserId}/threads_publish`,
                null,
                {
                    params: {
                        creation_id: containerId,
                        access_token: accessToken
                    }
                }
            );

            const postId = publishResponse.data.id;

            return {
                success: true,
                platformPostId: postId,
                platformPostUrl: `https://www.threads.net/t/${postId}`
            };
        } catch (error: any) {
            return this.handleError(error);
        }
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
