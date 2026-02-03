import { ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

import { PlatformConstraints as BasePlatformConstraints } from "@hayon/schemas";

export interface PlatformConstraints extends BasePlatformConstraints {
  previewType: "carousel" | "scroll" | "grid" | "column" | "stack";
}

export interface Platform {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  connected: boolean;
  constraints?: PlatformConstraints;
}

export interface PlatformPost {
  text: string;
  mediaFiles: File[];
  filePreviews: string[];
  existingMedia?: { s3Url: string; mimeType?: string; s3Key?: string }[];
  status?: string;
  error?: string;
  platformPostUrl?: string;
}

export type ViewMode = "create" | "preview";
