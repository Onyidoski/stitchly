export type DiscountType = 'fixed' | 'percent' | null

export type OrderMoneyFields = {
  total_amount?: number | null
  paid_amount?: number | null
  discount_type?: DiscountType | string | null
  discount_value?: number | null
}

function asNumber(value: number | null | undefined): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Naira discount applied to the order (clamped to subtotal). */
export function getDiscountNaira(order: OrderMoneyFields): number {
  const total = Math.max(0, asNumber(order.total_amount))
  const value = Math.max(0, asNumber(order.discount_value))
  const type = order.discount_type

  if (!type || value <= 0 || total <= 0) return 0

  if (type === 'percent') {
    return Math.min((total * value) / 100, total)
  }

  if (type === 'fixed') {
    return Math.min(value, total)
  }

  return 0
}

/** Amount the client owes before payments (subtotal − discount). */
export function getOrderNet(order: OrderMoneyFields): number {
  return Math.max(0, asNumber(order.total_amount) - getDiscountNaira(order))
}

/** Remaining balance after payments. */
export function getOrderBalance(order: OrderMoneyFields): number {
  return Math.max(0, getOrderNet(order) - asNumber(order.paid_amount))
}

/** Label for invoice/receipt discount rows. Empty when no discount. */
export function getDiscountLabel(order: OrderMoneyFields): string {
  const discount = getDiscountNaira(order)
  if (discount <= 0) return ''

  const value = asNumber(order.discount_value)
  if (order.discount_type === 'percent') {
    return `${value}% (₦${Math.round(discount).toLocaleString()})`
  }

  return `₦${Math.round(discount).toLocaleString()}`
}

export function getPaymentStatusForPaidAmount(
  order: OrderMoneyFields,
  paidAmount: number
): 'unpaid' | 'deposit' | 'paid' {
  const net = getOrderNet(order)
  const paid = Math.max(0, asNumber(paidAmount))
  if (paid <= 0) return 'unpaid'
  if (paid >= net) return 'paid'
  return 'deposit'
}

export function sumOrderNets(orders: OrderMoneyFields[]): number {
  return orders.reduce((sum, o) => sum + getOrderNet(o), 0)
}

export function sumOrderDiscounts(orders: OrderMoneyFields[]): number {
  return orders.reduce((sum, o) => sum + getDiscountNaira(o), 0)
}

export function sumOrderBalances(orders: OrderMoneyFields[]): number {
  return orders.reduce((sum, o) => sum + getOrderBalance(o), 0)
}
