import mongoose, { Schema, Document } from "mongoose";

export type ChatRole = "user" | "assistant" | "tool";

export interface IChatMessage {
  role: ChatRole;
  content: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface IChatSession extends Document {
  userId: mongoose.Types.ObjectId;
  history: IChatMessage[];
  pinVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { type: String, enum: ["user", "assistant", "tool"], required: true },
    content: { type: String, default: "" },
    tool_call_id: { type: String },
    tool_calls: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    history: { type: [ChatMessageSchema], default: [] },
    pinVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChatSession = mongoose.model<IChatSession>("ChatSession", ChatSessionSchema);