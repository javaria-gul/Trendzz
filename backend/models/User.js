// backend/models/User.js
import mongoose from "mongoose";
// Debug: Check if user model has coverImage field
export const checkUserModel = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if coverImage field exists in the schema
    const userSchema = User.schema.obj;
    const hasCoverImageField = 'coverImage' in userSchema;
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        coverImage: user.coverImage,
        hasCoverImage: !!user.coverImage
      },
      schema: {
        hasCoverImageField: hasCoverImageField,
        coverImageType: userSchema.coverImage ? typeof userSchema.coverImage : 'undefined'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstLogin: { type: Boolean, default: true },
  username: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: "/avatars/avatar1.png" },
   coverImage: { type: String, default: "" }, // ✅ Make sure this exists
  bio: { type: String, default: "" },
  // ML Recommendation fields
  batch: {
    type: String,
    default: ''
  },
  semester: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },
  interests: [{
    type: String
  }],
  skills: [{
    type: String
  }],
  
  subjects: { type: [String], default: [] },

  following: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  followers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  admirers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  admirersCount: { type: Number, default: 0 },
  blockedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  postsCount: { type: Number, default: 0 },
lastSeen: { type: Date, default: Date.now },

  // Email verification fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  emailVerificationSentAt: Date,
  status: { type: String, enum: ['active', 'pending', 'disabled'], default: 'pending' },

  // Privacy settings
  privacySettings: {
    showEmail: { type: Boolean, default: true },
    showFollowers: { type: Boolean, default: true },
    showFollowing: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true }
  },

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;