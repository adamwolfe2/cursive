// Credit Package Definitions
// Shared between client and server to ensure consistent pricing

export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  pricePerCredit: number
  savings: number
  popular?: boolean
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 99,
    pricePerCredit: 0.99,
    savings: 0,
  },
  {
    id: 'growth',
    name: 'Growth',
    credits: 500,
    price: 399,
    pricePerCredit: 0.80,
    savings: 20,
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    credits: 1000,
    price: 699,
    pricePerCredit: 0.70,
    savings: 30,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    credits: 5000,
    price: 2999,
    pricePerCredit: 0.60,
    savings: 40,
  },
]

/**
 * Validates a credit purchase request against defined packages
 * @returns The matching package or null if invalid
 */
export function validateCreditPurchase(params: {
  packageId: string
  credits: number
  amount: number
}): CreditPackage | null {
  const pkg = CREDIT_PACKAGES.find((p) => p.id === params.packageId)

  if (!pkg) {
    return null // Invalid package ID
  }

  // Validate credits and amount match the package exactly
  if (pkg.credits !== params.credits || pkg.price !== params.amount) {
    return null // Tampered values
  }

  return pkg
}
