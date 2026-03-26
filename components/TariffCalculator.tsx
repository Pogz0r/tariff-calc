'use client'

import { useState } from 'react'

interface FormData {
  industry: string
  country: string
  shipmentValue: string
}

interface EstimateResult {
  rate: number
  tariffAmount: number
  dutyAmount: number
  hstAmount: number
  totalCost: number
  hsCode: string
  industryLabel: string
}

const INDUSTRIES: Record<string, { hsCode: string; rate: number; label: string }> = {
  electronics: { hsCode: '8471', rate: 0.13, label: 'Electronics & Tech' },
  automotive: { hsCode: '8703', rate: 0.065, label: 'Automotive Parts' },
  textiles: { hsCode: '6204', rate: 0.18, label: 'Textiles & Apparel' },
  machinery: { hsCode: '8481', rate: 0.025, label: 'Machinery' },
  food: { hsCode: '2001', rate: 0.08, label: 'Food & Agriculture' },
  chemicals: { hsCode: '2933', rate: 0.06, label: 'Chemicals' },
  furniture: { hsCode: '9403', rate: 0.09, label: 'Furniture' },
  other: { hsCode: '9999', rate: 0.05, label: 'Other' },
}

const COUNTRIES: Record<string, { multiplier: number; label: string }> = {
  CN: { multiplier: 1.0, label: 'China' },
  US: { multiplier: 0.0, label: 'United States' },
  MX: { multiplier: 0.0, label: 'Mexico' },
  VN: { multiplier: 1.2, label: 'Vietnam' },
  DE: { multiplier: 0.0, label: 'Germany' },
  JP: { multiplier: 0.05, label: 'Japan' },
  KR: { multiplier: 0.05, label: 'South Korea' },
  TW: { multiplier: 1.1, label: 'Taiwan' },
  IN: { multiplier: 0.75, label: 'India' },
  other: { multiplier: 0.1, label: 'Other Country' },
}

const HST_RATE = 0.13

export default function TariffCalculator() {
  const [step, setStep] = useState<'form' | 'email' | 'result'>('form')
  const [formData, setFormData] = useState<FormData>({
    industry: '',
    country: '',
    shipmentValue: '',
  })
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEstimate = async () => {
    if (!formData.industry || !formData.country || !formData.shipmentValue) {
      setError('Please fill in all fields.')
      return
    }

    const value = parseFloat(formData.shipmentValue.replace(/[^0-9.]/g, ''))
    if (isNaN(value) || value <= 0) {
      setError('Please enter a valid shipment value.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tariff-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      setResult(data)
      setStep('email')
    } catch {
      setError('Failed to calculate estimate. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      await fetch('/api/submit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, industry: formData.industry, country: formData.country, shipmentValue: formData.shipmentValue }),
      })
      setStep('result')
    } catch {
      setError('Failed to submit email. You can still view your estimate below.')
      setStep('result')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val)

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          How much will your imports cost in tariffs?
        </h1>
        <p className="text-slate-400 text-lg">
          Get a rough estimate for your shipment in under 30 seconds.
        </p>
      </div>

      {/* Card */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your industry</option>
                {Object.entries(INDUSTRIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Country of Origin</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select country</option>
                {Object.entries(COUNTRIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shipment Value (CAD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="text"
                  value={formData.shipmentValue}
                  onChange={(e) => setFormData({ ...formData, shipmentValue: e.target.value })}
                  placeholder="10,000"
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleEstimate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Calculating...' : 'Get Estimate'}
            </button>
          </div>
        )}

        {/* Email Gate Step */}
        {step === 'email' && result && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Estimated Tariff Rate</p>
              <p className="text-3xl font-bold text-white">{(result.rate * 100).toFixed(1)}%</p>
              <p className="text-slate-400 mt-2">
                Approx. {formatCurrency(result.tariffAmount)} on {formatCurrency(parseFloat(formData.shipmentValue.replace(/[^0-9.]/g, '')))} CAD shipment
              </p>
            </div>

            <div className="text-center">
              <p className="text-white font-medium mb-4">Enter your email to see the full breakdown</p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  {loading ? '...' : 'Unlock'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button
                onClick={() => setStep('result')}
                className="text-slate-500 text-sm mt-3 hover:text-slate-300"
              >
                Skip — view estimate without email
              </button>
            </div>
          </div>
        )}

        {/* Result Step */}
        {step === 'result' && result && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-sm text-slate-400 uppercase tracking-wide mb-1">Estimated Total Additional Cost</p>
              <p className="text-5xl font-bold text-white">{formatCurrency(result.totalCost)}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300">Shipment Value</span>
                <span className="text-white font-medium">{formatCurrency(parseFloat(formData.shipmentValue.replace(/[^0-9.]/g, '')))}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300">Tariff ({(result.rate * 100).toFixed(1)}%)</span>
                <span className="text-amber-400 font-medium">{formatCurrency(result.dutyAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <span className="text-slate-300">HST ({(HST_RATE * 100).toFixed(1)}%)</span>
                <span className="text-amber-400 font-medium">{formatCurrency(result.hstAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-white font-semibold">Total</span>
                <span className="text-white font-bold text-lg">{formatCurrency(result.totalCost)}</span>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-lg px-4 py-3 text-xs text-slate-500">
              HS Code: <span className="text-slate-400">{result.hsCode}</span> — {result.industryLabel}. Estimates are approximate and based on publicly available MFN tariff rates.
            </div>

            <button
              onClick={() => { setStep('form'); setResult(null); setEmail(''); setFormData({ industry: '', country: '', shipmentValue: '' }); }}
              className="w-full border border-slate-600 hover:border-slate-500 text-slate-300 font-medium py-3 rounded-lg transition-colors mt-4"
            >
              Calculate Another Shipment
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-slate-600 text-xs mt-8">
        Estimates based on Canada MFN tariff rates. Final costs may vary.
      </p>
    </div>
  )
}
