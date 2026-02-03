import { z } from "zod";
import { PLATFORM_CONSTRAINTS, PLATFORMS, PlatformType } from "./constants";

export const identifierSchema = z
  .string()
  .regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.bsky\.social$/, "Invalid Bluesky handle");

export const blueskyAppPasswordSchema = z
  .string()
  .regex(/^[a-z0-9]{4}(-[a-z0-9]{4}){3}$/, "Invalid Bluesky app password format");

export const blueskyConnectSchema = z.object({
  identifier: identifierSchema,
  appPassword: blueskyAppPasswordSchema,
});

/**
 * Validates post content (text and media) for a specific platform.
 */
export const postContentSchema = z.object({
  text: z.string(),
  mediaItems: z
    .array(
      z.object({
        s3Url: z.string().url(),
        s3Key: z.string().optional(),
        mimeType: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Creates a schema for a specific platform post.
 */
export const createPlatformPostSchema = (platform: PlatformType) => {
  const constraints = PLATFORM_CONSTRAINTS[platform];
  return z
    .object({
      text: z
        .string()
        .max(constraints.maxChars, `Text exceeds ${platform} limit of ${constraints.maxChars}`),
      mediaItems: z
        .array(
          z.object({
            s3Url: z.string().url(),
            s3Key: z.string().optional(),
            mimeType: z.string().optional(),
          }),
        )
        .max(
          constraints.maxImages,
          `Too many images for ${platform} (max ${constraints.maxImages})`,
        )
        .optional()
        .default([]),
    })
    .refine(
      (data) => {
        if (constraints.requiresImage && (!data.mediaItems || data.mediaItems.length === 0)) {
          return false;
        }
        return true;
      },
      {
        message: `${platform} requires at least one image`,
        path: ["mediaItems"],
      },
    );
};

/**
 * Validates the platformSpecificContent object.
 */
export const platformSpecificPostSchema = z.record(z.unknown()).superRefine((data, ctx) => {
  Object.entries(data).forEach(([platform, content]) => {
    if (!PLATFORMS.includes(platform as PlatformType)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Unsupported platform: ${platform}`,
        path: [platform],
      });
      return;
    }

    const schema = createPlatformPostSchema(platform as PlatformType);
    const result = schema.safeParse(content);

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: [platform, ...issue.path],
        });
      });
    }
  });
});
