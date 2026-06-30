export const walletCreatedTemplate = (
  firstName: string,
  accountNumber: string,
) => ({
  subject: "Your NairaX Wallet is Ready 💳",
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%); padding: 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0 0 8px; font-size: 24px; }
    .header h1 span { color: #38BDF8; }
    .header p { color: #94a3b8; margin: 0; font-size: 14px; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 12px; }
    .message { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 24px; }
    .wallet-card { background: linear-gradient(135deg, #0F172A, #1E3A5F); border-radius: 14px; padding: 28px; color: white; margin-bottom: 32px; }
    .wallet-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .wallet-number { font-size: 26px; font-weight: 700; letter-spacing: 3px; font-family: 'Courier New', monospace; color: #38BDF8; }
    .wallet-name { margin-top: 20px; font-size: 14px; color: #cbd5e1; }
    .tip { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 13px; color: #166534; margin-bottom: 24px; }
    .footer { background: #F8FAFC; padding: 24px 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Naira<span>X</span></h1>
      <p>Wallet Created Successfully</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${firstName},</p>
      <p class="message">Your NairaX wallet has been created and is ready to use. Here are your wallet details:</p>
      <div class="wallet-card">
        <div class="wallet-label">Account Number</div>
        <div class="wallet-number">${accountNumber}</div>
        <div class="wallet-name">${firstName}'s NairaX Wallet</div>
      </div>
      <div class="tip">
        💡 <strong>Tip:</strong> Share your account number to receive funds from other NairaX users or from any Nigerian bank.
      </div>
      <p class="message">Keep your account number safe and never share your PIN or password with anyone.</p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} NairaX. All rights reserved.
    </div>
  </div>
</body>
</html>`,
});
