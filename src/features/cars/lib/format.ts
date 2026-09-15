const currencyFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const amountFormatter = new Intl.NumberFormat('en-EG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** "EGP 1,250.00" — for prose and toasts. */
export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)

/** "1,250.00" — for table columns whose header already says EGP. */
export const formatAmount = (amount: number): string => amountFormatter.format(amount)
