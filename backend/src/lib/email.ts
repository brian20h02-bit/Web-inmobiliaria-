import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendVerificationEmail(
  email: string,
  nombre: string,
  token: string,
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const url = `${frontendUrl}/verify-email?token=${token}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Paola Castillo Inmobiliaria" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verificá tu cuenta — Paola Castillo Inmobiliaria',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#1e3a5f;margin-bottom:8px;">Hola ${nombre},</h2>
        <p style="color:#374151;">Gracias por registrarte. Para activar tu cuenta hacé clic en el botón:</p>
        <p style="margin:24px 0;">
          <a href="${url}"
             style="background:#5B7FA3;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">
            Verificar mi email
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">El link expira en <strong>24 horas</strong>.</p>
        <p style="color:#6b7280;font-size:14px;">Si no creaste una cuenta, podés ignorar este mensaje.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:12px;">Paola Castillo Inmobiliaria</p>
      </div>
    `,
  })
}
