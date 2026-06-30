import mongoose, { Document, Schema } from "mongoose";

export type FundVisibility = "public" | "private";
export type FundCategory = "gift" | "community_support" | "other";
export type FundStatus = "active" | "completed" | "expired";

export interface IAjoFund extends Document {
  creatorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  targetAmount: number;
  amountRaised: number;
  visibility: FundVisibility;
  category: FundCategory;
  status: FundStatus;
  deadline: Date;
  inviteCode?: string;
  joinedUsers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AjoFundSchema = new Schema<IAjoFund>(
  {
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 100,
    },
    amountRaised: {
      type: Number,
      default: 0,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      required: true,
    },
    category: {
      type: String,
      enum: ["gift", "community_support", "other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "expired"],
      default: "active",
    },
    deadline: {
      type: Date,
      required: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true, 
    },
    joinedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

AjoFundSchema.index({ visibility: 1, status: 1 });
AjoFundSchema.index({ creatorId: 1 });

export const AjoFund = mongoose.model<IAjoFund>("AjoFund", AjoFundSchema);