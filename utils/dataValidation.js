// File Purpose: Shared validation, sanitization, and resume normalization helpers for server requests.
import mongoose from "mongoose";

// ─── Text Sanitization ────────────────────────────────────────────────────────

export const sanitizeText = (value, options = {}) => {
  const { maxLength = 1000, preserveNewlines = false } = options;
  if (value === null || value === undefined) return "";
  let str = String(value).trim();
  if (!preserveNewlines) str = str.replace(/[\r\n]+/g, " ");
  str = preserveNewlines ? str.replace(/[ \t]{2,}/g, " ") : str.replace(/\s{2,}/g, " ");
  if (maxLength && str.length > maxLength) str = str.slice(0, maxLength);
  return str;
};

// ─── Boolean Sanitization ─────────────────────────────────────────────────────

export const sanitizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true" || value === "1";
  if (typeof value === "number") return value === 1;
  return false;
};

// ─── ObjectId Validation ──────────────────────────────────────────────────────

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Date Normalization ───────────────────────────────────────────────────────
// Converts any date string the AI might return into YYYY-MM format (max 7 chars).
// Handles: "November 2025", "Nov 2025", "2025-11", "11/2025", "2025", etc.

const MONTH_MAP = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
  jan: "01", feb: "02", mar: "03", apr: "04",
  jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

export const normalizeDateToYYYYMM = (val) => {
  if (!val || typeof val !== "string") return "";
  const str = val.trim();
  if (!str) return "";

  // Already YYYY-MM
  if (/^\d{4}-\d{2}$/.test(str)) return str;

  // "Month YYYY" or "Month, YYYY" e.g. "November 2025", "Nov 2025"
  const monthYear = str.match(/^([a-zA-Z]+)[,\s]+(\d{4})$/);
  if (monthYear) {
    const month = MONTH_MAP[monthYear[1].toLowerCase()];
    if (month) return `${monthYear[2]}-${month}`;
  }

  // "YYYY Month" e.g. "2025 November"
  const yearMonth = str.match(/^(\d{4})[,\s]+([a-zA-Z]+)$/);
  if (yearMonth) {
    const month = MONTH_MAP[yearMonth[2].toLowerCase()];
    if (month) return `${yearMonth[1]}-${month}`;
  }

  // "MM/YYYY" or "M/YYYY"
  const slashFormat = str.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashFormat) {
    return `${slashFormat[2]}-${slashFormat[1].padStart(2, "0")}`;
  }

  // "YYYY/MM"
  const slashFormatRev = str.match(/^(\d{4})\/(\d{2})$/);
  if (slashFormatRev) return `${slashFormatRev[1]}-${slashFormatRev[2]}`;

  // Just a year "YYYY" — default to January
  if (/^\d{4}$/.test(str)) return `${str}-01`;

  // If it's already 7 chars or less and looks date-like, pass through
  if (str.length <= 7) return str;

  // Can't parse — return empty to avoid schema violation
  return "";
};

// ─── Resume Input Normalization ───────────────────────────────────────────────
//
// FIX (critical data-loss bug):
// The previous version of this function ALWAYS returned a full object with
// every resume field (personal_info, experience, education, projects, skills,
// professional_summary) — even when `data` only contained `{ public: true }`
// or `{ template: "modern" }` for a partial update (visibility toggle, template
// switch, colour change).
//
// Because every field defaulted to "" / [] when absent from `data`, the
// resulting object was then passed to `$set: normalized` in Mongoose,
// which OVERWROTE the entire personal_info / experience / education / skills /
// projects fields with blanks — silently wiping out the user's real resume
// content on every partial update (e.g. toggling Public/Private).
//
// FIX: Only include a key in the returned object if the corresponding key was
// actually present in the incoming `data`. This makes `$set` a true partial
// update — untouched fields are left alone in the database.
//
// FIX (field name mismatch):
// The frontend (AppContext / ResumeBuilder / all templates) uses `projects`
// (plural) everywhere — it is also the correct field name in Resume.js schema.
// This function previously wrote to `project` (singular), a stray legacy
// field that the frontend never reads. That meant projects added in the UI
// were saved to a field (`project`) that prepareResumeResponse also never
// returned — so projects always appeared empty after reload.
// FIX: normalize to `projects` (plural) — matches schema + frontend + API
// response. The legacy `project` (singular) field is left alone (untouched,
// not written to) and prepareResumeResponse no longer reads from it.

export const normalizeResumeInput = (data = {}) => {
  const s = (val) => (typeof val === "string" ? val.trim() : "");
  const a = (val) => (Array.isArray(val) ? val : []);
  const has = (key) => Object.prototype.hasOwnProperty.call(data, key);

  const result = {};

  if (has("professional_summary")) {
    result.professional_summary = s(data.professional_summary);
  }

  if (has("skills")) {
    result.skills = a(data.skills)
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
  }

  if (has("personal_info")) {
    const pi = data.personal_info || {};
    result.personal_info = {
      image: s(pi.image),
      full_name: s(pi.full_name),
      profession: s(pi.profession),
      email: s(pi.email),
      phone: s(pi.phone),
      location: s(pi.location),
      linkedin: s(pi.linkedin),
      website: s(pi.website),
    };
  }

  if (has("experience")) {
    result.experience = a(data.experience).map((e) => ({
      company: s(e.company),
      position: s(e.position),
      start_date: normalizeDateToYYYYMM(e.start_date),
      end_date: normalizeDateToYYYYMM(e.end_date),
      description: s(e.description),
      is_current: typeof e.is_current === "boolean" ? e.is_current : false,
    }));
  }

  // Accept either `projects` (current/correct) or legacy `project` as input,
  // but always write out to `projects` — the field the schema, frontend,
  // and API response all agree on.
  if (has("projects") || has("project")) {
    result.projects = a(data.projects || data.project).map((p) => ({
      name: s(p.name),
      type: s(p.type),
      description: s(p.description),
    }));
  }

  if (has("education")) {
    result.education = a(data.education).map((e) => ({
      institution: s(e.institution),
      degree: s(e.degree),
      field: s(e.field),
      graduation_date: normalizeDateToYYYYMM(e.graduation_date),
      gpa: s(e.gpa),
    }));
  }

  return result;
};

// ─── Resume Payload Validation ────────────────────────────────────────────────

export const validateResumePayload = (body = {}, options = {}) => {
  const { requireTitle = false } = options;
  const errors = [];

  const normalized = { ...normalizeResumeInput(body) };

  if (typeof body.title !== "undefined") {
    const title = sanitizeText(body.title, { maxLength: 120 });
    if (requireTitle && !title) errors.push("Title is required");
    if (title) normalized.title = title;
  } else if (requireTitle) {
    errors.push("Title is required");
  }

  if (typeof body.template !== "undefined") {
    normalized.template = sanitizeText(body.template, { maxLength: 32 });
  }

  if (typeof body.accent_color !== "undefined") {
    normalized.accent_color = sanitizeText(body.accent_color, { maxLength: 16 });
  }

  if (typeof body.isPublic !== "undefined") normalized.isPublic = sanitizeBoolean(body.isPublic);
  if (typeof body.public !== "undefined") normalized.public = sanitizeBoolean(body.public);
  if (typeof body.removeBackground !== "undefined") normalized.removeBackground = sanitizeBoolean(body.removeBackground);

  return { errors, normalized };
};

// ─── Auth Payload Validation ──────────────────────────────────────────────────

export const validateAuthPayload = (body = {}, mode = "login") => {
  const errors = [];

  const email = sanitizeText(body.email, { maxLength: 254 }).toLowerCase();
  const password = sanitizeText(body.password, { maxLength: 128 });

  if (!email) errors.push("Email is required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email address");

  if (!password) errors.push("Password is required");
  else if (mode === "register" && password.length < 6) errors.push("Password must be at least 6 characters");

  const normalized = { email, password };

  if (mode === "register") {
    const name = sanitizeText(body.name, { maxLength: 100 });
    if (!name) errors.push("Name is required");
    normalized.name = name;
  }

  return { errors, normalized };
};

// ─── Resume Response Formatter ────────────────────────────────────────────────
//
// FIX: now returns `projects` (plural) — matches frontend/schema — instead of
// the legacy `project` (singular) field that the frontend never read.
// Also added: title, template, accent_color, public — these were missing from
// the response entirely, even though the frontend's normalizeResume() expects
// them (it falls back to defaults, masking the bug, but the saved values were
// never round-tripped back to the UI after a reload).

export const prepareResumeResponse = (resumeDoc) => {
  if (!resumeDoc) return null;
  const resume = typeof resumeDoc.toObject === "function" ? resumeDoc.toObject() : { ...resumeDoc };

  return {
    _id: resume._id,
    userId: resume.userId,
    title: resume.title || "",
    professional_summary: resume.professional_summary || "",
    skills: Array.isArray(resume.skills) ? resume.skills : [],
    personal_info: {
      image: resume.personal_info?.image || "",
      full_name: resume.personal_info?.full_name || "",
      profession: resume.personal_info?.profession || "",
      email: resume.personal_info?.email || "",
      phone: resume.personal_info?.phone || "",
      location: resume.personal_info?.location || "",
      linkedin: resume.personal_info?.linkedin || "",
      website: resume.personal_info?.website || "",
    },
    experience: Array.isArray(resume.experience) ? resume.experience : [],
    projects: Array.isArray(resume.projects)
      ? resume.projects
      : Array.isArray(resume.project)
        ? resume.project
        : [],
    education: Array.isArray(resume.education) ? resume.education : [],
    public: resume.public ?? resume.isPublic ?? false,
    isPublic: resume.isPublic ?? resume.public ?? false,
    template: resume.template || "classic",
    accent_color: resume.accent_color || "#3B82F6",
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
};