import nodemailer from "nodemailer";
import env from "../config/env.js";
import { ApiError } from "./ApiError.js";

let transporter;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!env.SMTP_HOST) {
    throw new ApiError(500, "SMTP email transport is not configured");
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS
        }
      : undefined
  });

  return transporter;
}

export async function sendSignupApprovalEmail({ requester, approveUrl }) {
  if (!env.APPROVAL_TO_EMAIL) {
    throw new ApiError(500, "APPROVAL_TO_EMAIL is not configured");
  }

  const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER || env.APPROVAL_TO_EMAIL;

  await getTransporter().sendMail({
    from: fromEmail,
    to: env.APPROVAL_TO_EMAIL,
    subject: `Approval required: ${requester.businessName}`,
    text: `New signup request\nBusiness: ${requester.businessName}\nName: ${requester.fullName}\nEmail: ${requester.email}\nApprove: ${approveUrl}`,
    html: `
      <h2>New POS Signup Request</h2>
      <p><strong>Business:</strong> ${requester.businessName}</p>
      <p><strong>Name:</strong> ${requester.fullName}</p>
      <p><strong>Email:</strong> ${requester.email}</p>
      <p>
        <a href="${approveUrl}" style="display:inline-block;padding:10px 14px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px;">
          Approve Signup
        </a>
      </p>
      <p>If the button does not work, use this link: ${approveUrl}</p>
    `
  });
}
