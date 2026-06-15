// File Purpose: Nodemailer transporter config for sending verification emails.
import nodemailer from "nodemailer";
import dns from "dns";

// FIX: On Render (and some other hosts), Node resolves smtp.gmail.com to an
// IPv6 address by default, but the host's network can't route IPv6 egress —
// causing "connect ENETUNREACH <ipv6-addr> - Local (:::0)".
// Forcing the DNS resolver to prefer IPv4 ("ipv4first") fixes this without
// needing any nodemailer-specific config, and is safe in environments that
// DO support IPv6 too.
dns.setDefaultResultOrder("ipv4first");

// FIX: Replaced the `service: "gmail"` shorthand with explicit SMTP host/port.
// The shorthand internally maps to smtp.gmail.com:465 (secure) anyway, but
// being explicit avoids any ambiguity in how nodemailer resolves the service
// name, and makes it trivial to switch providers via env vars later.
// FIX: secure must be false for port 587 (STARTTLS) and true for port 465
// (implicit TLS). Render's free tier blocks outbound port 465 entirely
// (connections time out — ETIMEDOUT — even with correct IPv4 routing), so
// MAIL_PORT=587 should be set in the environment, which requires secure:false.
const mailPort = Number(process.env.MAIL_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: mailPort,
  secure: mailPort === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // App password (not your regular password for Gmail)
  },
});

// Verify the transporter config on startup so connection issues show up in
// logs immediately rather than only when the first email is sent.
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mailer config error:", error.message);
  } else {
    console.log("✅ Mailer is ready to send messages");
  }
});

/**
 * Send account verification email
 * @param {string} toEmail - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 */
export const sendVerificationEmail = async (toEmail, name, token) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Resume Builder" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: "Verify your Resume Builder account",
    html: `
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
    `,
  };

  await transporter.sendMail(mailOptions);
};

