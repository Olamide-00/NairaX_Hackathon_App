import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type WalletStatus = "active" | "suspended" | "closed";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  provider: string;
  accountHolderId: string;
  accountRef: string;
  balance: number;
  availableBalance: number;
  accountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  currency: string;
  status: WalletStatus;
  pin: string;
  createdAt: Date;
  updatedAt: Date;

  // methods
  comparePin(candidate: string): Promise<boolean>;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    provider: {
      type: String,
      default: "nomba",
    },
    accountHolderId: {
      type: String,
      required: true,
      unique: true,
    },
    accountRef: {
      type: String,
      required: true,
      unique: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    bankAccountNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bankAccountName: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "closed"],
      default: "active",
    },
    pin: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

WalletSchema.pre("save", async function (this: IWallet) {
  if (!this.isModified("pin")) return;
  this.pin = await bcrypt.hash(this.pin, 10);
});

// ─── Methods ──────────────────────────────────────────────────────────────────

WalletSchema.methods.comparePin = function (candidate: string) {
  return bcrypt.compare(candidate, this.pin);
};

WalletSchema.index({ userId: 1, status: 1 });

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);