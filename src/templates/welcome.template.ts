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
    .header { background: #0F172A; padding: 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0 0 8px; font-size: 28px; }
    .header h1 span { color: #38BDF8; }
    .header p { color: #94a3b8; margin: 0; font-size: 14px; }
    .body { padding: 40px; }
    .greeting { font-size: 18px; font-weight: 600; color: #0F172A; margin-bottom: 12px; }
    .message { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
    .features { background: #F8FAFC; border-radius: 10px; padding: 24px; margin-bottom: 32px; }
    .feature { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .feature:last-child { margin-bottom: 0; }
    .feature-icon { font-size: 20px; margin-right: 12px; }
    .feature-text h4 { margin: 0 0 4px; font-size: 14px; color: #0F172A; }
    .feature-text p { margin: 0; font-size: 13px; color: #64748b; }
    .cta { text-align: center; margin-bottom: 32px; }
    .cta a { background: #0F172A; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block; }
    .footer { background: #F8FAFC; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Naira<span>X</span></h1>
      <p>Your account is now active</p>
    </div>
    <div class="body">
      <p class="greeting">Welcome aboard, ${firstName}! 👋</p>
      <p class="message">
        Your email has been verified and your NairaX account is ready to go.
        Here's what you can do with your account:
      </p>
      <div class="features">
        <div class="feature">
          <span class="feature-icon">💳</span>
          <div class="feature-text">
            <h4>Virtual Wallet</h4>
            <p>Send and receive money instantly with your NairaX wallet.</p>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">📱</span>
          <div class="feature-text">
            <h4>Airtime & Bills</h4>
            <p>Top up airtime and pay bills directly from your wallet.</p>
          </div>
        </div>
        <div class="feature">
          <span class="feature-icon">🔒</span>
          <div class="feature-text">
            <h4>Bank-grade Security</h4>
            <p>Your funds are protected with industry-leading encryption.</p>
          </div>
        </div>
      </div>
      <div class="cta">
        <a href="${process.env.CLIENT_URL}">Get Started</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} NairaX. All rights reserved.<br/>
      Questions? Reply to this email or contact support.
    </div>
  </div>
</body>
</html>`,
});
