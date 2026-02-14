import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  type: "info" | "warning" | "success" | "error";
  message: string;
  read: boolean;
  relatedResource?: {
    type: "post" | "login";
    id: mongoose.Types.ObjectId;
    model: "Post" | "RefreshToken";
  };
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedResource: {
      type: { type: String, enum: ["post", "login"] },
      id: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: "relatedResource.model",
      },
      model: {
        type: String,
        required: true,
        enum: ["Post", "RefreshToken"],
      },
    },
  },
  { timestamps: true },
);

export default mongoose.model<INotification>("Notification", NotificationSchema);
