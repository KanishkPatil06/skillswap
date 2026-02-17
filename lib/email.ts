import nodemailer from "nodemailer"

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10)
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || "SkillSwap <noreply@skillswap.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Returns a configured Nodemailer transporter, or null if SMTP is not set up.
 */
function getTransporter() {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    })
}

/** Map notification type to an accent color and emoji for the email */
const typeStyles: Record<string, { color: string; emoji: string }> = {
    message: { color: "#7c3aed", emoji: "💬" },
    file_shared: { color: "#7c3aed", emoji: "📎" },
    connection_request: { color: "#3b82f6", emoji: "🤝" },
    connection_accepted: { color: "#10b981", emoji: "✅" },
    session_booked: { color: "#f59e0b", emoji: "📅" },
    session_reminder: { color: "#f97316", emoji: "⏰" },
    rating_received: { color: "#eab308", emoji: "⭐" },
    endorsement: { color: "#ec4899", emoji: "🏅" },
}

/**
 * Send a notification email.
 * Non-blocking, logs errors gracefully — never throws.
 */
export async function sendNotificationEmail(
    to: string,
    type: string,
    title: string,
    message: string,
    link?: string
): Promise<boolean> {
    const transporter = getTransporter()

    if (!transporter) {
        console.log("[Email] SMTP not configured, skipping email for:", type)
        return false
    }

    const style = typeStyles[type] || { color: "#7c3aed", emoji: "🔔" }
    const actionUrl = link ? `${APP_URL}${link}` : APP_URL

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${style.color},#7c3aed);padding:32px 40px;text-align:center">
              <div style="font-size:36px;margin-bottom:8px">${style.emoji}</div>
              <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">
              <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px">
                ${message}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td style="background:${style.color};border-radius:10px;padding:14px 32px">
                    <a href="${actionUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
                      View on SkillSwap →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#fafafa;border-top:1px solid #e5e7eb;text-align:center">
              <p style="color:#9ca3af;font-size:12px;margin:0">
                You received this because of your notification preferences on
                <a href="${APP_URL}" style="color:${style.color};text-decoration:none">SkillSwap</a>.
                Manage your preferences in your profile settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    try {
        await transporter.sendMail({
            from: SMTP_FROM,
            to,
            subject: `${style.emoji} ${title} — SkillSwap`,
            html,
        })
        console.log(`[Email] Sent "${type}" email to ${to}`)
        return true
    } catch (err) {
        console.error("[Email] Failed to send:", err)
        return false
    }
}

/**
 * Map notification type to the corresponding email preference column.
 */
export function getEmailPreferenceKey(
    type: string
): string | null {
    const map: Record<string, string> = {
        message: "email_new_messages",
        file_shared: "email_new_messages",
        connection_request: "email_connection_requests",
        connection_accepted: "email_connection_requests",
        session_booked: "email_session_reminders",
        session_reminder: "email_session_reminders",
        rating_received: "email_rating_received",
        endorsement: "email_rating_received",
    }
    return map[type] || null
}
