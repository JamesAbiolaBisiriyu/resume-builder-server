// File Purpose: Mongoose schema for storing resume documents and preview metadata.
import mongoose from "mongoose";

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Resume",
      trim: true,
      maxlength: 120,
    },

    public: {
      type: Boolean,
      default: false,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    template: {
      type: String,
      default: "classic",
      enum: ["classic", "modern", "minimal", "minimal-image"],
    },

    accent_color: {
      type: String,
      default: "#3B82F6",
      trim: true,
      maxlength: 16,
    },

    professional_summary: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    skills: [
      {
        type: String,
        trim: true,
        maxlength: 80,
      },
    ],

    personal_info: {
      image: { type: String, default: "", trim: true, maxlength: 500 },
      full_name: { type: String, default: "", trim: true, maxlength: 120 },
      profession: { type: String, default: "", trim: true, maxlength: 120 },
      email: { type: String, default: "", trim: true, maxlength: 254 },
      phone: { type: String, default: "", trim: true, maxlength: 40 },
      location: { type: String, default: "", trim: true, maxlength: 160 },
      linkedin: { type: String, default: "", trim: true, maxlength: 500 },
      website: { type: String, default: "", trim: true, maxlength: 500 },
    },
    experience: [
      {
        company: { type: String, trim: true, maxlength: 120 },
        position: { type: String, trim: true, maxlength: 120 },
        start_date: { type: String, trim: true, maxlength: 7 },
        end_date: { type: String, trim: true, maxlength: 7 },
        description: { type: String, trim: true, maxlength: 5000 },
        is_current: { type: Boolean },
      },
    ],

    // FIX: removed the legacy duplicate `project` (singular) array field.
    // The frontend, ResumePreview, and all four templates only ever read
    // `projects` (plural) — the singular field was dead weight that the
    // old normalizeResumeInput() wrote to by mistake, while this `projects`
    // field was left empty and never returned to the client.
    projects: [
      {
        name: { type: String, trim: true, maxlength: 160 },
        type: { type: String, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 5000 },
      },
    ],

    education: [
      {
        institution: { type: String, trim: true, maxlength: 160 },
        degree: { type: String, trim: true, maxlength: 160 },
        field: { type: String, trim: true, maxlength: 160 },
        graduation_date: { type: String, trim: true, maxlength: 7 },
        gpa: { type: String, trim: true, maxlength: 40 },
      },
    ],
  },
  {
    timestamps: true,
    minimize: false,
  },
);

const Resume = mongoose.model("Resume", ResumeSchema);

export default Resume;