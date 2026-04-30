import DealCalculator from './DealCalculator'

export default function DealCalculatorPage() {
  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deal Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure packages, calculate infrastructure costs, and generate pricing for client deals in real-time.
        </p>
      </div>
      <DealCalculator />
    </div>
  )
}
