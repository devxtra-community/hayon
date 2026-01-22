import { BasePostingService, PostResult } from "./base.posting.service";
import { PostQueueMessage } from "../../lib/queues/types";
import { tumblrOAuth } from "../../utils/tumblrOAuth";
import axios from "axios";

// ============================================================================
// CONSTRAINTS
// ============================================================================

const TUMBLR_CONSTRAINTS = {
    MAX_CHARS: 4096,
    MAX_PHOTOS: 10,
    MAX_PHOTO_SIZE: 20_000_000,  // 20MB
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
        if (payload.content.text && payload.content.text.length > TUMBLR_CONSTRAINTS.MAX_CHARS) {
            return `Text exceeds ${TUMBLR_CONSTRAINTS.MAX_CHARS} characters`;
        }

        const mediaCount = payload.content.mediaUrls?.length || 0;
        if (mediaCount > TUMBLR_CONSTRAINTS.MAX_PHOTOS) {
            return `Maximum ${TUMBLR_CONSTRAINTS.MAX_PHOTOS} photos allowed`;
        }

        return null;
    }

    async uploadMedia(mediaUrls: string[], credentials: any): Promise<string[]> {
        // Tumblr accepts URLs directly in the NPF content block
        return mediaUrls;
    }

    async createPost(
        payload: PostQueueMessage,
        credentials: any,
        mediaUrls: string[]
    ): Promise<PostResult> {
        const { blogHostname, auth } = credentials;
        const { oauthToken, oauthTokenSecret } = auth;

        try {
            // Using NPF (Neue Post Format) for modern posting
            const content: any[] = [];

            if (payload.content.text) {
                content.push({
                    type: "text",
                    text: payload.content.text
                });
            }

            if (mediaUrls && mediaUrls.length > 0) {
                mediaUrls.forEach(url => {
                    content.push({
                        type: "image",
                        media: [{ url }]
                    });
                });
            }

            const requestData = {
                url: `${this.apiUrl}/blog/${blogHostname}/posts`,
                method: "POST"
            };

            // Sign request with OAuth 1.0a
            // IMPORTANT: Do NOT include JSON body in authorize() if it's not form-encoded parameters
            const headers = tumblrOAuth.toHeader(
                tumblrOAuth.authorize(requestData, {
                    key: oauthToken,
                    secret: oauthTokenSecret
                })
            );

            const response = await axios.post(
                requestData.url,
                { content }, // This is the JSON body, NOT included in signature
                { headers: { ...headers, "Content-Type": "application/json" } }
            );

            const postId = response.data.response.id_string || response.data.response.id;
            return {
                success: true,
                platformPostId: postId.toString(),
                platformPostUrl: `https://www.tumblr.com/posts/${postId}`
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
