import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { AUTH } from "..";

export type Gender = "male" | "female";

export type UserTier =
  | "Starter"
  | "Hustler"
  | "Grinder"
  | "Big Player"
  | "Big Boss"
  | "Don"
  | "Legend"
  | "Odogwu";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date | null;
  refreshToken?: string | null;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  age?: number;
  gender?: Gender;
  xPoints: number;
  tier: UserTier;
  createdAt: Date;
  updatedAt: Date;

  // methods
  comparePassword(candidate: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    refreshToken: { type: String, select: false, default: null },
    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },
    age: { type: Number },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    xPoints: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: [
        "Starter",
        "Hustler",
        "Grinder",
        "Big Player",
        "Big Boss",
        "Don",
        "Legend",
        "Odogwu",
      ],
      default: "Starter",
    },
  },
  { timestamps: true },
);
userSchema.index({ xPoints: -1 }); 

// hooks

userSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, AUTH.BCRYPT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

// methods

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({ loginAttempts: 1, lockUntil: null });
    return;
  }

  const update: Record<string, unknown> = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= AUTH.MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    update.$set = { lockUntil: new Date(Date.now() + AUTH.LOCK_DURATION_MS) };
  }

  await this.updateOne(update);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ loginAttempts: 0, lockUntil: null });
};

export const User = mongoose.model<IUser>("User", userSchema);