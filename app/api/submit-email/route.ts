import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DATA_PATH = '/data/.openclaw/workspace/automations/tariff-emails.json'

interface EmailEntry {
  email: string
  industry: string
  country: string
  shipmentValue: string
  timestamp: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const entry: EmailEntry = {
      email,
      industry: body.industry || '',
      country: body.country || '',
      shipmentValue: body.shipmentValue || '',
      timestamp: new Date().toISOString(),
    }

    let emails: EmailEntry[] = []
    if (existsSync(DATA_PATH)) {
      try {
        const raw = require('fs').readFileSync(DATA_PATH, 'utf-8')
        emails = JSON.parse(raw)
      } catch {
        emails = []
      }
    }

    // Deduplicate by email
    emails = emails.filter((e: EmailEntry) => e.email !== email)
    emails.push(entry)

    writeFileSync(DATA_PATH, JSON.stringify(emails, null, 2))

    return NextResponse.json({ success: true, count: emails.length })
  } catch (err) {
    console.error('submit-email error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
