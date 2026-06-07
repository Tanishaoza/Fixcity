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

// ─── SECURITY MIDDLEWARE (THE BOUNCERS) ───────────────────────────────────

const protectUser = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied. Please log in first." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Session expired or invalid token." });
  }
};

const protectAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Admin Access Denied." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    if (verified.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. You are not an admin." });
    }

    req.admin = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid Admin Session." });
  }
};

// ─── AI ROUTE ────────────────────────────────────────────────────────────

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
    await Issue.findByIdAndUpdate(issueId, { aiStatus: "Failed" });
  }
}

// ─── GEOLOCATION / DUPLICATE ENGINE ──────────────────────────────────────

function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findDuplicateIssue(newLat, newLon, category) {
  const lat1 = parseFloat(newLat);
  const lon1 = parseFloat(newLon);

  if (isNaN(lat1) || isNaN(lon1)) {
    console.log("⚠️ [DUPLICATE ENGINE] Invalid coordinates skipped.");
    return null;
  }

  const lookbackPeriod = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); 
  console.log(`🔍 [DUPLICATE ENGINE] Checking "${category}" near (${lat1}, ${lon1})`);

  const existingIssues = await Issue.find({
    category,
    status: { $ne: "Resolved" },
    isDuplicate: false,
    createdAt: { $gte: lookbackPeriod },
  });

  for (const issue of existingIssues) {
    if (!issue.latitude || !issue.longitude) continue;

    const lat2 = parseFloat(issue.latitude);
    const lon2 = parseFloat(issue.longitude);
    if (isNaN(lat2) || isNaN(lon2)) continue;

    const distance = calculateDistanceInMeters(lat1, lon1, lat2, lon2);
    console.log(`📏 Distance to Issue ${issue.issueId}: ${distance.toFixed(1)} meters`);

    if (distance <= 250) {
      console.log(`🎯 DUPLICATE FOUND! Linked to parent: ${issue.issueId}`);
      return issue;
    }
  }

  console.log("❌ [DUPLICATE ENGINE] No match found nearby.");
  return null;
}

// ─── ISSUE MANIPULATION ENDPOINTS ────────────────────────────────────────

app.post("/submit", protectUser, upload.single("image"), async (req, res) => {
  try {
    const duplicateIssue = await findDuplicateIssue(
      Number(req.body.latitude),
      Number(req.body.longitude),
      req.body.category
    );

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
      isDuplicate: !!duplicateIssue,
      parentIssueId: duplicateIssue ? duplicateIssue.issueId : "",
      duplicateCount: 1,
    });

    await newIssue.save();

    if (duplicateIssue) {
      await Issue.findByIdAndUpdate(duplicateIssue._id, {
        $inc: { duplicateCount: 1 },
      });
    }

    res.json({
      success: true,
      message: duplicateIssue
        ? `This issue looks similar to an existing report (${duplicateIssue.issueId}). We have linked it for admin review.`
        : "Issue saved successfully. AI analysis is processing.",
      duplicateOf: duplicateIssue ? duplicateIssue.issueId : null,
      isDuplicate: !!duplicateIssue,
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
  } catch (error) {
    console.log("Submit error:", error);
    res.status(500).json({ error: "Failed to save issue" });
  }
});

app.get("/track/:issueId", async (req, res) => {
  try {
    const issue = await Issue.findOne({ issueId: req.params.issueId });
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }
    res.json(issue);
  } catch (error) {
    console.log("Track error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin Panel Fetch: Filters out duplicates entirely to avoid flood crashes
app.get("/issues", protectAdmin, async (req, res) => {
  try {
    const issues = await Issue.find({
      $or: [
        { isDuplicate: false },
        { isDuplicate: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch issues" });
  }
});

// Admin Status Updates: Cascades resolution to every linked child duplicate report
app.patch("/issues/:id/status", protectAdmin, async (req, res) => {
  try {
    const updatedIssue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // Always push updates out to linked child entries matching parentIssueId
    await Issue.updateMany(
  {
    $or: [
      { parentIssueId: updatedIssue.issueId },
      { issueId: updatedIssue.issueId }
    ]
  },
  { status: req.body.status }
);

    console.log(`🔔 [STATUS CASCADE] Main issue ${updatedIssue.issueId} and all duplicates set to: ${req.body.status}`);
    res.json(updatedIssue);
  } catch (error) {
    console.log("Update status error:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

// ─── AUTH & ACCOUNT MANAGEMENT ───────────────────────────────────────────

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
    res.json({ success: true, message: "Account created successfully" });
  } catch (error) {
    console.log("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.json({ success: true, token, admin: { email, role: "admin" } });
  }

  res.status(401).json({ error: "Invalid admin credentials" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend working" });
});

// User Dashboard History: Shows all reports submitted by the user, including duplicates
app.get("/history/:email", protectUser, async (req, res) => {
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