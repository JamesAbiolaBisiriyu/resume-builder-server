// // File Purpose: User authentication and profile controller for registration, login, and resume lookup.
// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import Resume from "../models/Resume.js";
// import {
//   prepareResumeResponse,
//   sanitizeText,
//   validateAuthPayload,
// } from "../utils/dataValidation.js";

// const generateToken = (userId) => {
//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });
//   return token;
// };

// // Controller for Registration
// // POST /api/users/register
// export const registerUser = async (req, res) => {
//   try {
//     const { errors, normalized } = validateAuthPayload(req.body, "register");

//     if (errors.length > 0) {
//       return res.status(400).json({ message: errors[0], errors });
//     }

//     const { name, email, password } = normalized;

//     // Check if user already exists
//     const user = await User.findOne({ email });
//     if (user) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // Create new user
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newuser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     // return success message
//     const token = generateToken(newuser._id);
//     newuser.password = undefined; // Exclude password from response

//     return res
//       .status(201)
//       .json({ message: "User registered successfully", user: newuser, token });
//   } catch (error) {
//     return res
//       .status(400)
//       .json({ message: "Error registering user", error: error.message });
//   }
// };

// // Controller for user login
// // POST /api/users/register

// export const loginUser = async (req, res) => {
//   try {
//     const { errors, normalized } = validateAuthPayload(req.body, "login");

//     if (errors.length > 0) {
//       return res.status(400).json({ message: errors[0], errors });
//     }

//     const { email, password } = normalized;

//     // Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "Invalid email or password" });
//     }
//     // check if password is correct
//     if (!user.comparedPassword(password)) {
//       return res.status(400).json({ message: "Invalid email or password" });
//     }

//     // return success message
//     const token = generateToken(user._id);
//     user.password = undefined; // Exclude password from response

//     return res
//       .status(200)
//       .json({ message: "User logged in successfully", user, token });
//   } catch (error) {
//     return res
//       .status(400)
//       .json({ message: "Error logging in user", error: error.message });
//   }
// };

// // Controller for fetching user by id
// // GET /api/users/data

// export const getUserById = async (req, res) => {
//   try {
//     const userId = req.userId;

//     // Check if user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // return user
//     user.password = undefined; // Exclude password from response
//     return res.status(200).json({ user });
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

// // controller for getting user resumes
// // GET: /api/users/resumes

// export const getUserResumes = async (req, res) => {
//   try {
//     const userId = req.userId;

//     // return user Resumes
//     const resumes = await Resume.find({ userId });
//     return res.status(200).json({
//       resumes: resumes.map((resume) => prepareResumeResponse(resume)),
//     });
//   } catch (error) {
//     return res.status(400).json({ message: error.message });
//   }
// };

// File Purpose: User authentication and profile controller for registration, login, verification, and resume lookup.
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Resume from "../models/Resume.js";
import {
  prepareResumeResponse,
  sanitizeText,
  validateAuthPayload,
} from "../utils/dataValidation.js";
import { sendVerificationEmail } from "../configs/mailer.js";

const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

// Controller for Registration
// POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { errors, normalized } = validateAuthPayload(req.body, "register");

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const { name, email, password } = normalized;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a verification token (random hex string, expires in 24h)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create new user (unverified)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (mailError) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(newUser._id);
      console.error("Mail error:", mailError.message);
      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
      });
    }

    return res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Error registering user", error: error.message });
  }
};

// Controller for email verification
// GET /api/users/verify-email?token=...
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is missing" });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }, // token must not be expired
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link. Please register again.",
      });
    }

    // Mark user as verified and clear the token
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Verification failed", error: error.message });
  }
};

// Controller for user login
// POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { errors, normalized } = validateAuthPayload(req.body, "login");

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const { email, password } = normalized;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox for the verification link.",
        unverified: true,
      });
    }

    // check if password is correct
    if (!user.comparedPassword(password)) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // return success message
    const token = generateToken(user._id);
    user.password = undefined; // Exclude password from response

    return res
      .status(200)
      .json({ message: "User logged in successfully", user, token });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Error logging in user", error: error.message });
  }
};

// Controller for resending verification email
// POST /api/users/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists
      return res.status(200).json({
        message:
          "If this email is registered and unverified, a new link has been sent.",
      });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "This account is already verified. Please log in." });
    }

    // Generate a new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationToken);

    return res.status(200).json({
      message: "A new verification email has been sent. Please check your inbox.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to resend email", error: error.message });
  }
};

// Controller for fetching user by id
// GET /api/users/data
export const getUserById = async (req, res) => {
  try {
    const userId = req.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // return user
    user.password = undefined; // Exclude password from response
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// controller for getting user resumes
// GET: /api/users/resumes
export const getUserResumes = async (req, res) => {
  try {
    const userId = req.userId;

    // return user Resumes
    const resumes = await Resume.find({ userId });
    return res.status(200).json({
      resumes: resumes.map((resume) => prepareResumeResponse(resume)),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

