export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}
