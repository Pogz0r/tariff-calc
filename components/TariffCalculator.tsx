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

  const shipmentValueNum = parseFloat(formData.shipmentValue.replace(/[^0-9.]/g, ''))

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
    <div className="max-w-xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
          Import Estimate Tool
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Know your tariff costs<br />before you ship.
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
          Enter your shipment details and get an instant estimate of duties, tariffs, and HST for imports into Canada.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-base"
              >
                <option value="">Select your industry</option>
                {Object.entries(INDUSTRIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country of Origin</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-base"
              >
                <option value="">Select country</option>
                {Object.entries(COUNTRIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Shipment Value (CAD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base">$</span>
                <input
                  type="text"
                  value={formData.shipmentValue}
                  onChange={(e) => setFormData({ ...formData, shipmentValue: e.target.value })}
                  placeholder="10,000"
                  className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-base"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

            <button
              onClick={handleEstimate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-base shadow-sm hover:shadow-md"
            >
              {loading ? 'Calculating...' : 'Get Estimate'}
            </button>
          </div>
        )}

        {/* Email Gate Step */}
        {step === 'email' && result && (
          <div className="space-y-6">
            {/* Mini preview */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Estimated Tariff Rate</p>
              <p className="text-4xl font-bold text-gray-900">{(result.rate * 100).toFixed(1)}%</p>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                Approx. {formatCurrency(result.dutyAmount)} in duties on a {formatCurrency(shipmentValueNum)} CAD shipment
              </p>
            </div>

            <div>
              <p className="text-gray-700 font-semibold mb-3 text-sm">Enter your email to unlock the full cost breakdown</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-base"
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md"
                >
                  {loading ? '...' : 'Unlock'}
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
              <button
                onClick={() => setStep('result')}
                className="text-gray-400 text-sm mt-3 hover:text-gray-600 transition-colors"
              >
                Skip — view estimate now
              </button>
            </div>
          </div>
        )}

        {/* Result Step — Invoice style */}
        {step === 'result' && result && (
          <div className="space-y-0">
            {/* Invoice Header */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Import Cost Estimate</p>
                <p className="text-sm text-gray-500">{result.industryLabel} · {COUNTRIES[formData.country]?.label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Shipment</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(shipmentValueNum)} CAD</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="divide-y divide-gray-100">
              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-gray-700 font-medium">Customs Tariff</p>
                  <p className="text-xs text-gray-400">{(result.rate * 100).toFixed(1)}% rate · HS Code {result.hsCode}</p>
                </div>
                <span className="text-gray-900 font-semibold">{formatCurrency(result.dutyAmount)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <div>
                  <p className="text-gray-700 font-medium">HST (Ontario)</p>
                  <p className="text-xs text-gray-400">{(HST_RATE * 100).toFixed(1)}% applied to (value + duty)</p>
                </div>
                <span className="text-gray-900 font-semibold">{formatCurrency(result.hstAmount)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-5 mt-2">
              <div>
                <p className="text-base font-bold text-gray-900">Total Additional Cost</p>
                <p className="text-xs text-gray-400">Duties + HST</p>
              </div>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(result.totalCost)}</span>
            </div>

            {/* Summary callout */}
            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-green-800">
                {formatCurrency(result.totalCost)} total fees on a {formatCurrency(shipmentValueNum)} CAD import
              </p>
              <p className="text-xs text-green-600 mt-1">
                That's {(result.totalCost / shipmentValueNum * 100).toFixed(1)}% of your shipment value
              </p>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 mt-5 leading-relaxed">
              Estimates are based on publicly available Canadian MFN tariff rates. Final costs may vary based on exact HS classification, preferential trade agreements, and other factors.
            </p>

            <button
              onClick={() => { setStep('form'); setResult(null); setEmail(''); setFormData({ industry: '', country: '', shipmentValue: '' }); }}
              className="w-full mt-5 border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium py-3 rounded-xl transition-all duration-200 text-sm"
            >
              Calculate Another Shipment
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-gray-400 text-xs mt-8">
        Powered by publicly available MFN tariff data · Canada Border Services Agency
      </p>
    </div>
  )
}
