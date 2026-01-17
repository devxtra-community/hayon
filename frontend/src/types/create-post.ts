import { ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface PlatformConstraints {
  maxImages: number;
  maxChars: number;
  requiresImage: boolean;
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

export type ViewMode = "create" | "preview";
