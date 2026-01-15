import { transporter } from "../config/mailer";
import { ENV } from "../config/env";

export const sendOtpMail = async (email: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"Hayon" <${ENV.EMAIL.USER}>`,
    to: email,
    subject: "Hayon OTP Code",
    html: `
    <div style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 30px 30px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #2e7d32; font-size: 32px; font-weight: 700;">
                                🔐 Verification Code
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                                Your One-Time Password (OTP) for verification is:
                            </p>
                            
                            <!-- OTP Box -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center; padding: 20px 0;">
                                        <div style="display: inline-block; background-color: #f1f8f4; border-radius: 8px; padding: 30px 40px;">
                                            <span id="otpCode" style="font-size: 42px; font-weight: 700; letter-spacing: 10px; color: #1b5e20; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                               
                            </table>
                            
                            <p style="margin: 30px 0 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                                This code will expire in <strong style="color: #2e7d32;">5 minutes</strong>.
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #666666;">
                                If you didn't request this code, please ignore this email or contact our support team if you have concerns.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Warning Box -->
                    <tr>
                        <td style="padding: 0 30px 30px 30px;">
                            <div style="background-color: #fff8e1; border-left: 4px solid #ffa726; padding: 15px; border-radius: 6px;">
                                <p style="margin: 0; font-size: 13px; color: #333333; line-height: 1.5;">
                                    <strong>⚠️ Security Note:</strong> Never share this code with anyone. Our team will never ask for your OTP.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                                Best regards,<br>
                                <strong style="color: #333333;">Hayon Team</strong>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; color: #999999;">
                                © 2024 Hayon. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>

    <div/>
    `,
  });
};

export const sendResetPasswordEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetLink = `${ENV.APP.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  await transporter.sendMail({
    from: `"Hayon" <${ENV.EMAIL.USER}>`,
    to: email,
    subject: "Hayon Password Reset",
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #2e7d32;">Password Reset Request</h2>
        <p>Hi,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <p style="text-align: center;">
            <a href="${resetLink}" style="background-color: #2e7d32; color: #ffffff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </p>
        <p>If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
        <p>Thanks,<br>The Hayon Team</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #999999;">© 2024 Hayon. All rights reserved.</p>
        </div>
    </div>
    `,
  });
};
