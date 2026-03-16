import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter;

const canSendMail = () =>
  Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPass && env.smtpFromEmail);

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }

  return transporter;
};

export const sendRegistrationOtpEmail = async ({ email, otp, name }) => {
  if (!canSendMail()) {
    console.log(`Registration OTP for ${email}: ${otp}`);
    return {
      delivered: false,
      fallback: true
    };
  }

  await getTransporter().sendMail({
    from: env.smtpFromEmail,
    to: email,
    subject: "Verify your registration OTP",
    html: `
      <div style="font-family: Arial, sans-serif; color: #14213d;">
        <h2>Verify your account</h2>
        <p>Hello ${name},</p>
        <p>Your OTP for registration is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1270c1;">${otp}</div>
        <p>This OTP will expire in ${env.registrationOtpExpiryMinutes} minutes.</p>
      </div>
    `
  });

  return {
    delivered: true,
    fallback: false
  };
};

export const sendPasswordResetOtpEmail = async ({ email, otp }) => {
  if (!canSendMail()) {
    console.log(`Password reset OTP for ${email}: ${otp}`);
    return {
      delivered: false,
      fallback: true
    };
  }

  await getTransporter().sendMail({
    from: env.smtpFromEmail,
    to: email,
    subject: "Verify your password reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; color: #14213d;">
        <h2>Reset your password</h2>
        <p>Your OTP for password reset is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1270c1;">${otp}</div>
        <p>This OTP will expire in ${env.registrationOtpExpiryMinutes} minutes.</p>
      </div>
    `
  });

  return {
    delivered: true,
    fallback: false
  };
};

export const sendLowStockAlertEmail = async ({ to, ownerName, productName, currentStock, threshold, vendorEmail }) => {
  if (!canSendMail()) {
    console.log(
      `Low stock alert for ${to}: ${productName}, stock=${currentStock}, threshold=${threshold}, vendor=${vendorEmail}`
    );
    return {
      delivered: false,
      fallback: true
    };
  }

  await getTransporter().sendMail({
    from: env.smtpFromEmail,
    to,
    subject: `Low stock alert: ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #14213d;">
        <h2>Low Stock Alert</h2>
        <p>Hello ${ownerName},</p>
        <p>A product has dropped below its reorder threshold.</p>
        <ul>
          <li><strong>Product:</strong> ${productName}</li>
          <li><strong>Current Stock:</strong> ${currentStock}</li>
          <li><strong>Reorder Threshold:</strong> ${threshold}</li>
          <li><strong>Vendor Email:</strong> ${vendorEmail}</li>
        </ul>
      </div>
    `
  });

  return {
    delivered: true,
    fallback: false
  };
};

export const sendPurchaseOrderEmail = async ({ to, vendorName, purchaseOrder, pdfBuffer }) => {
  const itemLines = purchaseOrder.items
    .map(
      (item) =>
        `<li>${item.productName} - Required Stock: ${item.requiredStock} - Price: ${Number(item.unitPrice).toFixed(2)}</li>`
    )
    .join("");

  if (!canSendMail()) {
    console.log(
      `Purchase order for ${to}: ${purchaseOrder.poNumber}, items=${purchaseOrder.items
        .map((item) => `${item.productName}:${item.requiredStock}`)
        .join(", ")}`
    );
    return {
      delivered: false,
      fallback: true
    };
  }

  await getTransporter().sendMail({
    from: env.smtpFromEmail,
    to,
    subject: `Restock requirement - ${purchaseOrder.poNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #14213d;">
        <h2>Restock Requirement</h2>
        <p>Hello ${vendorName},</p>
        <p>Please find the attached purchase order for restock requirement.</p>
        <p>Product details:</p>
        <ul>${itemLines}</ul>
      </div>
    `,
    attachments: [
      {
        filename: `${purchaseOrder.poNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }
    ]
  });

  return {
    delivered: true,
    fallback: false
  };
};
