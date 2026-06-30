import mongoose, { Schema, Document } from "mongoose";

export type TransactionType = "credit" | "debit";
export type TransactionStatus = "pending" | "success" | "failed";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);