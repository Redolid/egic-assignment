const currencyFormatter = new Intl.NumberFormat('en-EG', {
  style: 'currency',
  currency: 'EGP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount)
