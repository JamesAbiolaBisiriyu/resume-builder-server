import ai from "../configs/ai.js";
import Resume from "../models/Resume.js";
import {
  normalizeResumeInput,
  sanitizeText,
  validateResumePayload,
} from "../utils/dataValidation.js";

// POST: /api/ai/enhance-pro-sum
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const userContent = sanitizeText(req.body.userContent, {
      maxLength: 5000,
      preserveNewlines: true,
    });
    if (!userContent) {
      return res.status(400).json({ message: "Missing Required Field: userContent" });
    }
    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert resume writer and ATS optimization specialist.
Rewrite the user's professional summary into a compelling, professional, ATS-friendly resume summary.
Requirements:
- 50-100 words.
- Highlight key technical skills, strengths, and experience.
- Use strong professional language.
- Focus on value, achievements, and expertise.
- Keep it concise and impactful.
- Write in third person or implied first person resume style.
- Return only the final summary text.
- No headings, labels, bullet points, explanations, quotes, or markdown.`,
        },
        {
          role: "user",
          content: `Enhance this professional summary for a modern ATS-compliant resume:\n\n${userContent}`,
        },
      ],
    });
    const enhancedContent = response.choices[0].message.content;
    return res.status(200).json({ enhancedContent });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST: /api/ai/enhance-job-desc
export const enhanceJobDescription = async (req, res) => {
  try {
    const userContent = sanitizeText(req.body.userContent, {
      maxLength: 5000,
      preserveNewlines: true,
    });
    if (!userContent) {
      return res.status(400).json({ message: "Missing Required Field: userContent" });
    }
    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert in resume writing. Your task is to enhance the job description section of a resume. The job description should be in 1-2 sentences highlighting key responsibilities and achievements. Use action verbs and quantifiable results where possible. Make it ATS-friendly, and only return text, no options or anything else.",
        },
        { role: "user", content: userContent },
      ],
    });
    const enhancedContent = response.choices[0].message.content;
    return res.status(200).json({ enhancedContent });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST: /api/ai/upload-resume
export const uploadResume = async (req, res) => {
  try {
    console.log("=== uploadResume controller hit ===");

    const userId = req.userId;
    const title = sanitizeText(req.body.title, { maxLength: 120 });
    const resumeText = sanitizeText(req.body.resumeText, {
      maxLength: 50000,
      preserveNewlines: true,
    });

    console.log("title:", title);
    console.log("resumeText length:", resumeText?.length);

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!resumeText || resumeText.trim().length < 10) {
      return res.status(400).json({ message: "Resume text is required" });
    }

    console.log("Calling OpenAI...");

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert AI Agent that extracts structured data from resumes. Always return valid JSON only.",
        },
        {
          role: "user",
          content: `Extract all information from this resume and return a JSON object with exactly these fields:
{
  "professional_summary": "string",
  "skills": ["string"],
  "personal_info": {
    "image": "",
    "full_name": "string",
    "profession": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "website": "string"
  },
  "experience": [
    {
      "company": "string",
      "position": "string",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM",
      "description": "string",
      "is_current": false
    }
  ],
  "project": [
    {
      "name": "string",
      "type": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduation_date": "YYYY-MM",
      "gpa": "string"
    }
  ]
}

IMPORTANT: All dates must be in YYYY-MM format (e.g. "2023-04"). If only a year is known, use "YYYY-01".
Return ONLY the JSON object, no explanation, no markdown.

Resume text:
${resumeText}`,
        },
      ],
      // response_format: { type: "json_object" },
      //  response_format: { type: "json_object" },  
    });

    console.log("OpenAI response received");

    const extractedData = response.choices[0].message.content;
    console.log("Raw AI output:", extractedData.slice(0, 300));

    const parsedData = JSON.parse(extractedData);
    console.log("Parsed OK");

    const normalizedInput = { title, ...normalizeResumeInput(parsedData) };
    console.log("experience dates:", normalizedInput.experience?.map(e => ({ start: e.start_date, end: e.end_date })));

    const { errors, normalized } = validateResumePayload(normalizedInput, { requireTitle: true });
    console.log("Validation errors:", errors);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    console.log("Creating resume in DB...");
    const newResume = await Resume.create({ userId, ...normalized });
    console.log("Resume created:", newResume._id);

    return res.status(200).json({ resumeId: newResume._id });
  } catch (error) {
    console.error("uploadResume error:", error);
    return res.status(400).json({ message: error.message || "Unknown error" });
  }
};