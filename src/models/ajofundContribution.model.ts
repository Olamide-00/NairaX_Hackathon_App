import mongoose, { Document, Schema } from "mongoose";

export interface IAjoFundContribution extends Document {
  fundId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const AjoFundContributionSchema = new Schema<IAjoFundContribution>(
  {
    fundId: {
      type: Schema.Types.ObjectId,
      ref: "AjoFund",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
  },
  { timestamps: true }
);

AjoFundContributionSchema.index({ fundId: 1, amount: -1 }); 
AjoFundContributionSchema.index({ userId: 1 });

export const AjoFundContribution = mongoose.model<IAjoFundContribution>(
  "AjoFundContribution",
  AjoFundContributionSchema
);