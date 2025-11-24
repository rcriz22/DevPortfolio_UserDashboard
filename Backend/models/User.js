import mongoose from "mongoose";

const userSchema = new mongoose.Schema (
{
    resetToken: String,
    resetTokenExpiry: Date, 

  username: { 
    type: String, 
    required: true,
    minlength: 3,
    maxlength: 50
    },

  email: { 
    type: String, 
    required: true, 
    unique: true 
    },

  bio: {
    type: String,
    default: "",
    maxlength: 500
    },

  passwordHash: { 
    type: String 
    },
  
  passwordUpdatedAt: {
    type: Date,
    default: null
    },
    
  role: { 
    type: String, 
    enum: ["Admin", "Editor", "Contributor", "User", "Viewer"], 
    default: "User" 
    },
  
  provider: { 
    type: String, 
    default: "local" 
    },
  
  emailVerificationToken: {
      type: String,
      default: null
    },

  emailVerificationExpiry: {
      type: Date,
      default: null
    },
  
  isVerified: {
      type: Boolean,
      default: false
  },

  pendingEmail: {
  type: String,
  default: null
  }

},

  { timestamps: true }

);

export default mongoose.model("User", userSchema);