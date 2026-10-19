import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const generateSecureOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return null;
};

const getEmailHtmlTemplate = ({ title, preheader, name, otp, purposeText }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; color: #1e293b; }
            .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
            .gov-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 20px; padding: 4px 14px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; }
            .content { padding: 36px 28px; }
            .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
            .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
            .otp-box { background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-label { font-size: 12px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
            .otp-code { font-family: 'Consolas', 'Courier New', monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1e3a8a; margin: 8px 0; }
            .otp-expiry { font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 4px; }
            .security-note { font-size: 12px; line-height: 1.5; color: #64748b; background: #f1f5f9; padding: 14px; border-radius: 8px; margin-top: 24px; border-left: 4px solid #3b82f6; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .flag-stripe { height: 4px; background: linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%); }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="flag-stripe"></div>
            <div class="header">
                <div class="gov-badge">Official Statistical System • MoSPI</div>
                <h1>National Statistical Systems Training Academy (NSSTA)</h1>
                <p>AI-Enabled Skill Intelligence & Capacity Building Platform</p>
            </div>
            <div class="content">
                <div class="greeting">Namaste ${name || "Learner"},</div>
                <div class="message">
                    ${purposeText}
                </div>
                
                <div class="otp-box">
                    <div class="otp-label">Your One-Time Verification Code</div>
                    <div class="otp-code">${otp}</div>
                    <div class="otp-expiry">⏱️ Valid for 10 minutes only. Do not share this code.</div>
                </div>

                <div class="security-note">
                    <strong>Security Notice:</strong> Officers and personnel of the National Statistical System will never ask for your password or OTP. If you did not request this verification, please notify your nodal training administrator immediately.
                </div>
            </div>
            <div class="footer">
                © ${new Date().getFullYear()} Ministry of Statistics & Programme Implementation (MoSPI), Government of India.<br>
                Integrated with iGOT Karmayogi & NSSTA TPAC Framework.
            </div>
        </div>
    </body>
    </html>
    `;
};

export const sendSignupOtp = async (email, name, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "MoSPI-NSSTA Skill Intelligence"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@mospi.gov.in"}>`,
      to: email,
      subject: `[NSSTA-MoSPI] Your Account Verification Code: ${otp}`,
      html: getEmailHtmlTemplate({
        title: "Verify Your Account - NSSTA MoSPI",
        preheader: `Your verification code is ${otp}`,
        name,
        otp,
        purposeText:
          "Thank you for registering on the <strong>AI-Enabled Skill Intelligence and Learning Platform</strong> for India's Official Statistical System. Please enter the verification code below to activate your learner profile.",
      }),
    };

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`\n========================================\n[LOCAL DEV 2FA OTP] Signup OTP for ${email}: ${otp}\n========================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(
      `[EMAIL ERROR] Failed to send signup OTP to ${email}:`,
      error.message,
    );
    return { success: true, fallback: true, error: error.message };
  }
};

export const sendLoginOtp = async (email, name, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "MoSPI-NSSTA Skill Intelligence"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@mospi.gov.in"}>`,
      to: email,
      subject: `[NSSTA-MoSPI] Your Login Security Code: ${otp}`,
      html: getEmailHtmlTemplate({
        title: "Security Login Verification - NSSTA MoSPI",
        preheader: `Your login code is ${otp}`,
        name,
        otp,
        purposeText:
          "A secure sign-in attempt was initiated for your Official Statistics Learner account. Use the code below to complete authentication.",
      }),
    };

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`\n========================================\n[LOCAL DEV 2FA OTP] Login OTP for ${email}: ${otp}\n========================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(
      `[EMAIL ERROR] Failed to send login OTP to ${email}:`,
      error.message,
    );
    return { success: true, fallback: true, error: error.message };
  }
};

export const sendPasswordResetOtp = async (email, name, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "MoSPI-NSSTA Skill Intelligence"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@mospi.gov.in"}>`,
      to: email,
      subject: `[NSSTA-MoSPI] Your Password Reset Security Code: ${otp}`,
      html: getEmailHtmlTemplate({
        title: "Password Reset Request - NSSTA MoSPI",
        preheader: `Your password reset code is ${otp}`,
        name,
        otp,
        purposeText:
          "A request was received to reset your password on the <strong>AI-Enabled Skill Intelligence and Capacity Building Platform</strong>. Enter the 6-digit one-time code below to choose a new password.",
      }),
    };

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`\n========================================\n[LOCAL DEV 2FA OTP] Reset OTP for ${email}: ${otp}\n========================================\n`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(
      `[EMAIL ERROR] Failed to send password reset OTP to ${email}:`,
      error.message,
    );
    return { success: true, fallback: true, error: error.message };
  }
};

export const sendAlternateEmailOtp = async (email, name, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || "MoSPI-NSSTA Skill Intelligence"}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@mospi.gov.in"}>`,
      to: email,
      subject: `[NSSTA-MoSPI] Your Alternate Email Verification Code: ${otp}`,
      html: getEmailHtmlTemplate({
        title: "Verify Alternate Email - NSSTA MoSPI",
        preheader: `Your verification code is ${otp}`,
        name,
        otp,
        purposeText:
          "You have initiated a request to link or update this email address as your <strong>Alternate Recovery & Notification Email</strong> on the NSSTA-MoSPI Platform. Please enter the verification code below to confirm this address.",
      }),
    };

    if (transporter) {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(
      `[EMAIL ERROR] Failed to send alternate email OTP to ${email}:`,
      error.message,
    );
    return { success: true, fallback: true, error: error.message };
  }
};

export default {
  generateSecureOtp,
  sendSignupOtp,
  sendLoginOtp,
  sendPasswordResetOtp,
  sendAlternateEmailOtp,
};
