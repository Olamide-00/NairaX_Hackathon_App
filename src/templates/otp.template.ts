
export const otpTemplate = (
  firstName: string,
  otp: string,
  expiresMinutes: number,
) => ({
  subject: "Verify your email — NairaX",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { background: #0F172A; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .header span { color: #38BDF8; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 12px; }
    .message { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 32px; }
    .otp-box { background: #F1F5F9; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 32px; }
    .otp-code { font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #0F172A; font-family: 'Courier New', monospace; }
    .expiry { font-size: 13px; color: #94a3b8; margin-top: 10px; }
    .warning { font-size: 13px; color: #ef4444; background: #fef2f2; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .footer { background: #F8FAFC; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Naira<span>X</span></h1></div>
    <div class="body">
      <p class="greeting">Hi ${firstName},</p>
      <p class="message">Use the one-time code below to verify your email address and activate your account.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="expiry">Expires in ${expiresMinutes} minutes</div>
      </div>
      <div class="warning">⚠️ Never share this code with anyone. NairaX will never ask for it.</div>
      <p class="message">If you didn't create a NairaX account, you can safely ignore this email.</p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} NairaX. All rights reserved.</div>
  </div>
</body>
</html>`,
});



export const welcomeTemplate = (firstName: string) => ({
  subject: "Welcome to NairaX 🎉",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { background: #0F172A; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .header span { color: #38BDF8; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 12px; }
    .message { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 16px; }
    .footer { background: #F8FAFC; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Naira<span>X</span></h1></div>
    <div class="body">
      <p class="greeting">Welcome, ${firstName}! 🎉</p>
      <p class="message">Your account is now verified and fully active. You're all set to start using NairaX.</p>
      <p class="message">If you have any questions, our support team is always here to help.</p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} NairaX. All rights reserved.</div>
  </div>
</body>
</html>`,
});
