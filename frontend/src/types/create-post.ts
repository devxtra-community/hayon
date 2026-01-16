import { ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface Platform {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  connected: boolean;
}

export type ViewMode = "create" | "preview";
