import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

    const { name, email, phone, subject, message } = body as {
      name?: string
      email?: string
      phone?: string
      subject?: string
      message?: string
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!name || !email || !subject || !message)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    if (!emailRegex.test(email))
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    if (String(message).trim().length < 10)
      return NextResponse.json({ error: 'Message is too short' }, { status: 400 })

    // In production, integrate an email service (e.g., Resend, SendGrid, SES) here.
    // For now, we acknowledge receipt server-side.
    const receivedAt = new Date().toISOString()

    return NextResponse.json({ ok: true, receivedAt })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}
