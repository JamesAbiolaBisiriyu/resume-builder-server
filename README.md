# Resume Builder Backend API

A robust RESTful API powering the Resume Builder application. This backend provides authentication, resume management, AI-assisted resume enhancement, resume parsing, file uploads, and public resume sharing capabilities.

---

# Overview

The Resume Builder Backend is built with Node.js, Express.js, and MongoDB. It serves as the core engine behind the Resume Builder platform, handling user authentication, resume CRUD operations, AI integrations, and data persistence.

---

# Features

## Authentication & Authorization

* User registration
* User login
* JWT-based authentication
* Protected routes
* Secure password hashing using bcrypt

## Resume Management

* Create resumes
* Update resumes
* Delete resumes
* Retrieve resumes
* Public resume sharing
* Resume visibility controls

## AI-Powered Features

* Professional summary enhancement
* Job description enhancement
* Resume content optimization
* Resume information extraction from uploaded content

## Media Uploads

* Profile image uploads
* Image optimization
* Background removal support
* Image hosting using ImageKit

## Data Validation

* Request sanitization
* Resume payload validation
* MongoDB ObjectId validation
* Error handling and response standardization

---

# Technology Stack

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JSON Web Tokens (JWT)
* bcryptjs

## AI Integration

* OpenAI API

## File Uploads

* Multer
* ImageKit

## Security

* CORS
* Environment Variables
* Input Validation
* Request Sanitization

---

# Project Structure

```bash
server/
│
├── configs/
│   ├── ai.js
│   ├── db.js
│   ├── imageKit.js
│   └── multer.js
│
├── controllers/
│   ├── aiController.js
│   ├── resumeController.js
│   └── userController.js
│
├── middlewares/
│   └── authMiddleware.js
│
├── models/
│   ├── Resume.js
│   └── User.js
│
├── routes/
│   ├── ai.Routes.js
│   ├── resume.Routes.js
│   └── userRoutes.js
│
├── utils/
│   └── dataValidation.js
│
├── .env
├── package.json
├── package-lock.json
└── Server.js
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/JamesAbiolaBisiriyu/resume-builder-server.git

cd resume-builder-server
```

---

## Install Dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

---

# Running the Application

## Development

```bash
npm run server
```

Uses nodemon for automatic server restarts.

---

## Production

```bash
npm start
```

---

# API Base URL

Local:

```text
http://localhost:3000
```

Production:

```text
https://resume-builder-server-5apl.onrender.com
```

---

# Authentication Endpoints

## Register User

### POST

```http
/api/users/register
```

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

---

## Login User

### POST

```http
/api/users/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Returns:

```json
{
  "token": "jwt_token"
}
```

---

# Resume Endpoints

## Create Resume

### POST

```http
/api/resumes/create
```

Authentication Required

---

## Update Resume

### PUT

```http
/api/resumes/update
```

Authentication Required

Supports:

* Resume content updates
* Template changes
* Accent color changes
* Image uploads

---

## Delete Resume

### DELETE

```http
/api/resumes/delete/:resumeId
```

Authentication Required

---

## Get Resume

### GET

```http
/api/resumes/get/:resumeId
```

Authentication Required

---

## Public Resume

### GET

```http
/api/resumes/public/:resumeId
```

Public Access

---

# AI Endpoints

## Enhance Professional Summary

### POST

```http
/api/ai/enhance-pro-sum
```

Request:

```json
{
  "userContent": "Experienced software developer..."
}
```

---

## Enhance Job Description

### POST

```http
/api/ai/enhance-job-desc
```

Request:

```json
{
  "userContent": "Developed internal tools..."
}
```

---

## Upload Resume

### POST

```http
/api/ai/upload-resume
```

Request:

```json
{
  "title": "My Resume",
  "resumeText": "Resume content..."
}
```

AI extracts structured resume data and creates a resume entry.

---

# Security Features

## Authentication

* JWT verification middleware
* Protected routes
* User ownership validation

## Data Validation

* Resume schema validation
* Input sanitization
* Safe object handling

## CORS Protection

Allows:

```text
http://localhost:5173
```

and

```text
*.vercel.app
```

origins.

---

# Error Handling

Standardized API responses:

Example:

```json
{
  "message": "Resume not found"
}
```

Validation Errors:

```json
{
  "message": "Title is required"
}
```

---

# Health Check Endpoint

Useful for deployment platforms like Render.

### GET

```http
/healthz
```

Response:

```text
OK
```

---

# Deployment

## Backend Deployment

Platform:

Render

Start Command:

```bash
npm start
```

Build Command:

```bash
npm install
```

---

# Testing

Recommended tools:

* Postman
* Thunder Client
* Insomnia

Test:

* Authentication
* Resume CRUD operations
* AI endpoints
* Public resume links
* Image uploads

---

# Future Improvements

* Resume version history
* Cover letter generation
* AI resume scoring
* AI interview preparation
* Multi-language support
* User activity logs
* Resume analytics

---

# Author

## James Abiola Bisiriyu

Operations Manager | Full Stack Developer

GitHub:
https://github.com/JamesAbiolaBisiriyu

---

# License

MIT License

This project is open-source and available for educational, personal, and commercial use under the terms of the MIT License.
