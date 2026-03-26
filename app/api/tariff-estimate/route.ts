import { NextRequest, NextResponse } from 'next/server'

const INDUSTRIES: Record<string, { hsCode: string; rate: number; label: string }> = {
  electronics: { hsCode: '8471', rate: 0.13, label: 'Computers & Electronics (HS 8471)' },
  automotive: { hsCode: '8703', rate: 0.065, label: 'Automotive Parts (HS 8703)' },
  textiles: { hsCode: '6204', rate: 0.18, label: 'Textiles & Apparel (HS 6204)' },
  machinery: { hsCode: '8481', rate: 0.025, label: 'Machinery & Valves (HS 8481)' },
  food: { hsCode: '2001', rate: 0.08, label: 'Food & Agriculture (HS 2001)' },
  chemicals: { hsCode: '2933', rate: 0.06, label: 'Chemicals (HS 2933)' },
  furniture: { hsCode: '9403', rate: 0.09, label: 'Furniture (HS 9403)' },
  other: { hsCode: '9999', rate: 0.05, label: 'General Merchandise' },
}

// Countries with elevated/retaliatory tariffs
const TARIFF_MULTIPLIERS: Record<string, number> = {
  CN: 2.5,   // China — elevated retaliatory tariffs
  US: 0.0,   // USA — no tariffs under USMCA
  MX: 0.0,   // Mexico — no tariffs under USMCA/CUSMA
  VN: 1.5,   // Vietnam
  DE: 0.0,   // Germany — EU, no special tariffs
  JP: 0.0,   // Japan — CPTPP, no tariffs
  KR: 0.5,   // South Korea — KORUS
  TW: 1.8,   // Taiwan
  IN: 1.2,   // India
  other: 0.5,
}

const HST_RATE = 0.13

export async function POST(req: NextRequest) {
  try {
    const { industry, country, shipmentValue } = await req.json()

    if (!industry || !shipmentValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const value = parseFloat(String(shipmentValue).replace(/[^0-9.]/g, ''))
    if (isNaN(value) || value <= 0) {
      return NextResponse.json({ error: 'Invalid shipment value' }, { status: 400 })
    }

    const industryData = INDUSTRIES[industry] || INDUSTRIES.other
    const multiplier = TARIFF_MULTIPLIERS[country] ?? TARIFF_MULTIPLIERS.other

    const effectiveRate = industryData.rate * multiplier
    const dutyAmount = Math.round(value * effectiveRate * 100) / 100
    const hstAmount = Math.round(dutyAmount * HST_RATE * 100) / 100
    const totalCost = Math.round((value + dutyAmount + hstAmount) * 100) / 100

    return NextResponse.json({
      rate: effectiveRate,
      tariffAmount: Math.round((dutyAmount + hstAmount) * 100) / 100,
      dutyAmount,
      hstAmount,
      totalCost,
      hsCode: industryData.hsCode,
      industryLabel: industryData.label,
    })
  } catch (err) {
    console.error('tariff-estimate error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
