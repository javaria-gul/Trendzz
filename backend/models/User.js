// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstLogin: { type: Boolean, default: true },
  username: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: "/avatars/avatar1.png" },
  bio: { type: String, default: "" }, // ✅ ADD THIS

  role: { type: String, enum: ["student", "faculty"], default: null },
  semester: { type: String, default: null },
  batch: { type: String, default: null },
  subjects: { type: [String], default: [] },

  following: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  followers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  admirers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  admirersCount: { type: Number, default: 0 },
  blockedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },

  // Email verification fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  emailVerificationSentAt: Date,
  status: { type: String, enum: ['active', 'pending', 'disabled'], default: 'pending' },

  // Privacy settings
  privacySettings: {
    profilePublic: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showFollowers: { type: Boolean, default: true },
    showFollowing: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true }
  }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;