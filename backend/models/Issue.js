import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
{
  issueId: String,

  name: String,
  email: String,

  title: String,
  category: String,
  description: String,
  location: String,
  latitude: Number,
  longitude: Number,

  image: String,

  severity: String,
  priority: String,

  aiStatus: {
    type: String,
    default: "Processing",
  },

  aiConfidence: {
    type: Number,
    default: 0,
  },

  aiReason: {
    type: String,
    default: "",
  },

  detectedObjects: {
    type: [String],
    default: [],
  },

  status: {
    type: String,
    default: "Pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  verificationStatus: {
  type: String,
  default: "Pending",
},

matchScore: {
  type: Number,
  default: 0,
},
isDuplicate: {
  type: Boolean,
  default: false,
},
parentIssueId: {
  type: String,
  default: "",
},
duplicateCount: {
  type: Number,
  default: 1,
},
},
{
  timestamps: true,
}
);

export default mongoose.model("Issue", issueSchema);