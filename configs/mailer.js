// File Purpose: Email sending config — sends verification emails via the Resend API.
//
// FIX (replaces SMTP/Nodemailer entirely):
// Render's free tier blocks ALL outbound SMTP traffic (ports 25, 465, 587)
// at the network level — confirmed by ETIMEDOUT/ENETUNREACH on every port
// tried, despite correct credentials and IPv4 DNS resolution. This is a
// known Render free-tier restriction to prevent spam abuse.
//
// Resend sends email via a plain HTTPS POST to api.resend.com (port 443),
// which is never blocked. This completely sidesteps the SMTP issue.
//
// SETUP REQUIRED:
//   1. npm install resend
//   2. Sign up at https://resend.com (free tier: 100 emails/day, 3000/month)
//   3. Get an API key from the Resend dashboard -> API Keys
//   4. Set RESEND_API_KEY in your environment (.env locally, Render env vars in prod)
//   5. (Optional but recommended) Verify your own domain in Resend -> Domains,
//      then set MAIL_FROM to an address on that domain, e.g.
//      "Resume Builder <noreply@yourdomain.com>"
//      Until you verify a domain, Resend only allows sending FROM
//      "onboarding@resend.dev" and only TO the email address you signed up
//      with — fine for initial testing, but you'll want your own domain for
//      real users.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.MAIL_FROM || "Resume Builder <onboarding@resend.dev>";

// Lightweight startup check — mirrors the old transporter.verify() behaviour
// so missing config shows up in logs immediately at boot.
if (!process.env.RESEND_API_KEY) {
  console.error("❌ Mailer config error: RESEND_API_KEY is not set");
} else {
  console.log("✅ Mailer is ready to send messages (Resend)");
}

/**
 * Send account verification email
 * @param {string} toEmail - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 */
export const sendVerificationEmail = async (toEmail, name, token) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 520px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07);">
          <div style="background: #22c55e; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Resume Builder</h1>
          </div>
          <div style="padding: 40px 36px;">
            <h2 style="color: #111827; margin-top: 0;">Hello, ${name}! 👋</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              Thanks for signing up. Please verify your email address to activate your account and start building professional resumes.
            </p>
            <div style="text-align: center; margin: 36px 0;">
              <a href="${verifyUrl}"
                 style="background: #22c55e; color: white; padding: 14px 36px; border-radius: 100px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
                Verify My Account
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
              This link expires in <strong>24 hours</strong>. If you didn't create this account, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
            <p style="color: #d1d5db; font-size: 12px; text-align: center;">
              Or paste this link in your browser:<br/>
              <span style="color: #6b7280; word-break: break-all;">${verifyUrl}</span>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: "Verify your Resume Builder account",
    html,
  });

  if (error) {
    // Surface a clear error so registerUser's catch can roll back the user
    // and the frontend shows "Failed to send verification email".
    throw new Error(error.message || "Resend failed to send email");
  }

  return data;
};