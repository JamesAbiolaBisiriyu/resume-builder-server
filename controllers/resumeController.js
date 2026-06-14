// File Purpose: Resume CRUD controller for authenticated and public resume flows.
import imagekit from "../configs/imageKit.js";
import Resume from "../models/Resume.js";
import fs from "fs";
import {
  isValidObjectId,
  prepareResumeResponse,
  sanitizeBoolean,
  validateResumePayload,
} from "../utils/dataValidation.js";

export const createResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { errors, normalized } = validateResumePayload(req.body, { requireTitle: true });
    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors });
    const newResume = await Resume.create({ userId, ...normalized });
    return res.status(201).json({ message: "Resume created successfully", resume: prepareResumeResponse(newResume) });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;
    if (!isValidObjectId(resumeId)) return res.status(400).json({ message: "Invalid resume id" });
    await Resume.findOneAndDelete({ _id: resumeId, userId });
    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;
    if (!isValidObjectId(resumeId)) return res.status(400).json({ message: "Invalid resume id" });
    const resume = await Resume.findOne({ userId, _id: resumeId });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    return res.status(200).json({ resume: prepareResumeResponse(resume) });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;
    if (!isValidObjectId(resumeId)) return res.status(400).json({ message: "Invalid resume id" });
    const resume = await Resume.findOne({ _id: resumeId, $or: [{ public: true }, { isPublic: true }] });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    return res.status(200).json({ resume: prepareResumeResponse(resume) });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId: bodyResumeId, resumeData, removeBackground } = req.body;
    const resumeId = req.params.resumeId || bodyResumeId;
    const image = req.file;

    if (!resumeId) return res.status(400).json({ message: "Resume id is required" });
    if (!isValidObjectId(resumeId)) return res.status(400).json({ message: "Invalid resume id" });

    const resumeDataCopy =
      typeof resumeData === "string"
        ? JSON.parse(resumeData)
        : { ...(resumeData || {}) };

    // If an image file was uploaded, upload to ImageKit and merge the URL into
    // personal_info — but only touch personal_info if it (or the image) is
    // actually part of this request, so normalizeResumeInput still treats
    // personal_info as "present" and includes it in the $set.
    if (image) {
      const uploadResponse = await imagekit.files.upload({
        file: fs.createReadStream(image.path),
        fileName: `resume-${userId}-${Date.now()}.jpg`,
        folder: "user-resumes",
        transformation: {
          pre: "w-300,h-300,fo-face,z-0.75" + (removeBackground ? ",e-bgremove" : ""),
        },
      });
      resumeDataCopy.personal_info = {
        ...(resumeDataCopy.personal_info || {}),
        image: uploadResponse.url,
      };
      fs.unlink(image.path, () => {});
    }

    if (typeof removeBackground !== "undefined") {
      resumeDataCopy.removeBackground = sanitizeBoolean(removeBackground);
    }

    // NOTE: validateResumePayload / normalizeResumeInput now only include keys
    // that were actually present in resumeDataCopy, so $set never wipes out
    // fields the client didn't send (e.g. toggling `public` no longer blanks
    // out personal_info, experience, education, etc).
    const isPartialUpdate = Object.keys(resumeDataCopy).every((k) =>
      ["public", "isPublic", "template", "accent_color", "removeBackground"].includes(k)
    );

    const { errors, normalized } = validateResumePayload(resumeDataCopy, {
      requireTitle: false,
    });

    if (errors.length > 0) return res.status(400).json({ message: errors[0], errors });

    if (Object.keys(normalized).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const resume = await Resume.findOneAndUpdate(
      { userId, _id: resumeId },
      { $set: normalized },
      { returnDocument: "after", runValidators: true },
    );

    if (!resume) return res.status(404).json({ message: "Resume not found" });

    return res.status(200).json({ message: "Resume updated successfully", resume: prepareResumeResponse(resume) });
  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: error.message });
  }
};