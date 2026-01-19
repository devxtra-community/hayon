// ============================================================================
// TEST ROUTES - FOR TESTING RABBITMQ DELAYED MESSAGE PLUGIN
// ============================================================================
// ⚠️ TESTING ONLY - REMOVE BEFORE PRODUCTION ⚠️
// ============================================================================

import { Router, Request, Response } from "express";
import { Producer } from "../lib/queues/producer";

const router = Router();

// ============================================================================
// TEST 1: Immediate Post (no delay)
// ============================================================================
// POST /api/test/post-now
// Body: { "platform": "bluesky", "text": "Hello World!" }

router.post("/post-now", async (req: Request, res: Response) => {
    try {
        const { platform = "bluesky", text = "Test post immediate" } = req.body;

        console.log("📤 [TEST] Publishing IMMEDIATE message...");

        const correlationId = await Producer.queueSocialPost({
            postId: `test_${Date.now()}`,
            userId: "test_user_123",
            platform,
            content: { text, mediaUrls: [] },
            // No scheduledAt = immediate
        });

        console.log(`✅ [TEST] Published with correlationId: ${correlationId}`);

        res.json({
            success: true,
            message: "Message published to queue (immediate)",
            correlationId,
            checkWorkerLogs: "Watch the worker terminal for processing",
        });
    } catch (error: any) {
        console.error("❌ [TEST] Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// TEST 2: Scheduled Post (with delay)
// ============================================================================
// POST /api/test/post-scheduled
// Body: { "platform": "bluesky", "text": "Scheduled post", "delaySeconds": 30 }

router.post("/post-scheduled", async (req: Request, res: Response) => {
    try {
        const {
            platform = "bluesky",
            text = "Test scheduled post",
            delaySeconds = 30  // Default 30 seconds delay
        } = req.body;

        // Calculate future time
        const scheduledAt = new Date(Date.now() + delaySeconds * 1000);

        console.log(`📤 [TEST] Publishing SCHEDULED message (delay: ${delaySeconds}s)...`);
        console.log(`   Scheduled for: ${scheduledAt.toISOString()}`);

        const correlationId = await Producer.queueSocialPost({
            postId: `test_scheduled_${Date.now()}`,
            userId: "test_user_123",
            platform,
            content: { text, mediaUrls: [] },
            scheduledAt,  // This triggers the delayed exchange
        });

        console.log(`✅ [TEST] Scheduled with correlationId: ${correlationId}`);

        res.json({
            success: true,
            message: `Message scheduled for ${delaySeconds} seconds from now`,
            correlationId,
            scheduledAt: scheduledAt.toISOString(),
            checkWorkerLogs: `Watch worker terminal - should process at ${scheduledAt.toLocaleTimeString()}`,
        });
    } catch (error: any) {
        console.error("❌ [TEST] Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================================
// TEST 3: Multiple platforms (to test routing)
// ============================================================================
// POST /api/test/post-multi
// Body: { "platforms": ["bluesky", "facebook"], "text": "Multi-platform test" }

router.post("/post-multi", async (req: Request, res: Response) => {
    try {
        const {
            platforms = ["bluesky", "facebook"],
            text = "Multi-platform test post"
        } = req.body;

        console.log(`📤 [TEST] Publishing to ${platforms.length} platforms...`);

        const results = [];

        for (const platform of platforms) {
            const correlationId = await Producer.queueSocialPost({
                postId: `test_multi_${Date.now()}_${platform}`,
                userId: "test_user_123",
                platform,
                content: { text, mediaUrls: [] },
            });

            results.push({ platform, correlationId });
            console.log(`   ✅ ${platform}: ${correlationId}`);
        }

        res.json({
            success: true,
            message: `Published to ${platforms.length} platforms`,
            results,
            checkWorkerLogs: "Watch worker terminal for multiple messages",
        });
    } catch (error: any) {
        console.error("❌ [TEST] Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
