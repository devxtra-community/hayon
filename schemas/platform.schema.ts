import { z } from "zod";

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
