import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import mongoose from "mongoose";
import Issue from "./models/Issue.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";


dotenv.config();

const app = express();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

console.log("🔥 SERVER STARTED");

// MongoDB local connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Upload folder
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "fixcity_issues",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });
const memoryUpload = multer({ storage: multer.memoryStorage() });

// AI analysis route
app.post("/analyze", memoryUpload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.body.title || !req.body.description || !req.body.category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const prompt = `
You are an AI civic issue inspector.

Analyze the image and text.

Title: ${req.body.title}
Description: ${req.body.description}
Selected category: ${req.body.category}

Return ONLY JSON:
{
  "category": "Pothole | Garbage | Water Leakage | Flooding | Broken Streetlight | Road Damage | Other",
  "severity": "High | Medium | Low",
  "priority": "Critical | Moderate | Minor",
  "confidence": 70,
  "reason": "short reason",
  "detectedObjects": ["object1", "object2"]
}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    let text = result.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const aiResult = JSON.parse(text);

    res.json(aiResult);
  } catch (error) {
    console.log("Gemini AI error:", error);
    res.status(500).json({ error: "AI Detection Failed" });
  }
});
async function analyzeIssueInBackground(issueId, imageUrl, title, description, category) {
  try {
    const prompt = `
You are an AI civic issue verification inspector.

Your job is not only to classify the issue, but also to check if the user's text matches the image.

User submitted:
Title: ${title}
Description: ${description}
Selected category: ${category}

Analyze the IMAGE first, then compare it with the user's title, description, and selected category.

Return ONLY valid JSON:
{
  "category": "Pothole | Garbage | Water Leakage | Flooding | Broken Streetlight | Road Damage | Spitting | Other",
  "severity": "High | Medium | Low",
  "priority": "Critical | Moderate | Minor",
  "confidence": 70,
  "verificationStatus": "Verified | Mismatch | Suspicious",
  "matchScore": 0,
  "reason": "short reason explaining whether image and text match",
  "detectedObjects": ["object1", "object2"]
}

Rules:
1. If the image clearly shows a different issue than the user's selected category, set verificationStatus to "Mismatch".
2. If verificationStatus is "Mismatch", confidence must be below 60.
3. If text says pothole but image shows wall stains/spitting, category must be "Spitting" or "Other", not "Pothole".
4. matchScore should be from 0 to 100.
5. Only give confidence above 85 if image, title, description, and selected category all match.
6. Do not blindly trust the selected category.
7. Image evidence is more important than user text.
`;

    const imageResponse = await fetch(imageUrl);
const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

const imageBuffer = await imageResponse.arrayBuffer();
const base64Image = Buffer.from(imageBuffer).toString("base64");

const result = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: contentType,
            data: base64Image,
          },
        },
        { text: prompt },
      ],
    },
  ],
});

    let text = result.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const aiResult = JSON.parse(text);

    await Issue.findByIdAndUpdate(issueId, {
  category: aiResult.category,
  severity: aiResult.severity,
  priority: aiResult.priority,

  aiConfidence: aiResult.confidence,
  aiReason: aiResult.reason,

  detectedObjects: aiResult.detectedObjects || [],

  verificationStatus: aiResult.verificationStatus,
  matchScore: aiResult.matchScore,

  aiStatus: "Completed",
});

  } catch (error) {
    console.log("Background AI error:", error);

    await Issue.findByIdAndUpdate(issueId, {
      aiStatus: "Failed",
    });
  }
}
// Submit issue and save in MongoDB
app.post("/submit", upload.single("image"), async (req, res) => {
  try {
    const newIssue = new Issue({
      aiStatus: "Processing",
      issueId: "FIX" + Date.now(),

      name: req.body.name,
      email: req.body.email,

      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      location: req.body.location,
      latitude: req.body.latitude,
      longitude: req.body.longitude,

      image: req.file?.path || "",

      severity: req.body.severity || "Medium",
      priority: req.body.priority || "Moderate",

      status: "Pending",
    });

    await newIssue.save();
    res.json({
  success: true,
  message: "Issue saved successfully. AI analysis is processing.",
  issueId: newIssue.issueId,
  issue: newIssue,
});

setImmediate(() => {
  analyzeIssueInBackground(
    newIssue._id,
    newIssue.image,
    newIssue.title,
    newIssue.description,
    newIssue.category
  );
});

return;

   
  } catch (error) {
    console.log("Submit error:", error);

    res.status(500).json({
      error: "Failed to save issue",
    });
  }
});

// Track issue by issueId
app.get("/track/:issueId", async (req, res) => {
  try {
    const issue = await Issue.findOne({
      issueId: req.params.issueId,
    });

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found",
      });
    }

    res.json(issue);
  } catch (error) {
    console.log("Track error:", error);

    res.status(500).json({
      error: "Server error",
    });
  }
});

// Admin: get all issues
app.get("/issues", async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.log("Fetch issues error:", error);

    res.status(500).json({
      error: "Failed to fetch issues",
    });
  }
});

// Admin: update issue status
app.patch("/issues/:id/status", async (req, res) => {
  try {
    
    

    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    
    res.json(updatedIssue);
  } catch (error) {
   console.log("Update status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    await user.save();

    res.json({
      success: true,
      message: "Account created successfully",
    });

  } catch (error) {
  console.log("Signup error:", error);
  res.status(500).json({ error: "Signup failed" });
}
});
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
  console.log("Login error:", error);
  res.status(500).json({ error: "Login failed" });
}
});
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign(
      { email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      admin: {
        email,
        role: "admin",
      },
    });
  }

  res.status(401).json({ error: "Invalid admin credentials" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working" });
});
app.get("/history/:email", async (req, res) => {
  try {
    const issues = await Issue.find({
      email: req.params.email,
    }).sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Running on port ${PORT}`);
});