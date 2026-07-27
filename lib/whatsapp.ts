import { getOrderBalance, getOrderNet } from '@/lib/order-money'

export type WhatsAppTemplateId =
    | 'general'
    | 'order_registered'
    | 'status_update'
    | 'ready_for_pickup'
    | 'payment_reminder'
    | 'delivery_reminder'

export type WhatsAppMessageContext = {
    clientName: string
    businessName: string
    orderName?: string
    status?: string
    deliveryDate?: string | Date | null
    totalAmount?: number
    paidAmount?: number
    discountType?: 'fixed' | 'percent' | null | string
    discountValue?: number
}

const TEMPLATE_LABELS: Record<WhatsAppTemplateId, string> = {
    general: 'General message',
    order_registered: 'Order confirmed',
    status_update: 'Status update',
    ready_for_pickup: 'Ready for pickup',
    payment_reminder: 'Payment reminder',
    delivery_reminder: 'Delivery reminder',
}

export function getWhatsAppTemplateLabel(id: WhatsAppTemplateId): string {
    return TEMPLATE_LABELS[id]
}

/** Normalize Nigerian phone numbers for wa.me (digits only, 234 country code). */
export function formatPhoneForWhatsApp(phone: string | null | undefined): string | null {
    if (!phone?.trim()) return null

    let digits = phone.replace(/\D/g, '')

    if (digits.startsWith('0')) {
        digits = `234${digits.slice(1)}`
    } else if (digits.length === 10 && /^[789]/.test(digits)) {
        digits = `234${digits}`
    } else if (digits.length === 11 && digits.startsWith('234')) {
        // ok
    } else if (!digits.startsWith('234')) {
        return null
    }

    if (digits.length < 12 || digits.length > 14) return null
    return digits
}

export function buildWhatsAppUrl(phone: string, message: string): string {
    const normalized = formatPhoneForWhatsApp(phone)
    if (!normalized) {
        throw new Error('Invalid phone number')
    }
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

function formatNaira(amount: number): string {
    return `₦${amount.toLocaleString('en-NG')}`
}

function formatDeliveryDate(date: string | Date | null | undefined): string {
    if (!date) return 'TBD'
    const d = typeof date === 'string' ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return 'TBD'
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatStatus(status: string | undefined): string {
    if (!status) return ''
    return status.charAt(0).toUpperCase() + status.slice(1)
}

function firstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] || fullName
}

export function buildWhatsAppMessage(
    templateId: WhatsAppTemplateId,
    ctx: WhatsAppMessageContext
): string {
    const name = firstName(ctx.clientName)
    const biz = ctx.businessName.trim() || 'Your tailor'
    const order = ctx.orderName?.trim() || 'your order'
    const delivery = formatDeliveryDate(ctx.deliveryDate)
    const status = formatStatus(ctx.status)
    const total = getOrderNet({
        total_amount: ctx.totalAmount,
        discount_type: ctx.discountType,
        discount_value: ctx.discountValue,
    })
    const paid = ctx.paidAmount ?? 0
    const balance = Math.max(0, total - paid)

    switch (templateId) {
        case 'order_registered':
            return `Hi ${name}, your order for ${order} (${formatNaira(total)}) has been registered with ${biz}. Expected delivery: ${delivery}. Thank you!`

        case 'status_update':
            return `Hi ${name}, your ${order} is now at the *${status}* stage. Delivery is still scheduled for ${delivery}. — ${biz}`

        case 'ready_for_pickup':
            return balance > 0
                ? `Good news ${name}! Your ${order} is ready for pickup. Balance: ${formatNaira(balance)}. — ${biz}`
                : `Good news ${name}! Your ${order} is ready for pickup. — ${biz}`

        case 'payment_reminder':
            return balance > 0
                ? `Hi ${name}, friendly reminder: ${formatNaira(balance)} balance remains on your ${order}. Thank you! — ${biz}`
                : `Hi ${name}, thank you — your payment for ${order} is complete. — ${biz}`

        case 'delivery_reminder':
            return `Hi ${name}, reminder: your ${order} is due ${delivery}. We'll keep you updated. — ${biz}`

        case 'general':
        default:
            return `Hi ${name}, this is ${biz}. How can we help you today?`
    }
}

/** Pick sensible templates based on order/payment state. */
export function getSuggestedTemplates(ctx: WhatsAppMessageContext): WhatsAppTemplateId[] {
    const balance = getOrderBalance({
        total_amount: ctx.totalAmount,
        paid_amount: ctx.paidAmount,
        discount_type: ctx.discountType,
        discount_value: ctx.discountValue,
    })
    const status = ctx.status?.toLowerCase()

    if (!ctx.orderName) {
        return ['general']
    }

    if (status === 'ready') {
        return ['ready_for_pickup', 'payment_reminder', 'status_update', 'general']
    }

    if (balance > 0) {
        return ['payment_reminder', 'status_update', 'delivery_reminder', 'order_registered', 'general']
    }

    if (status && status !== 'delivered') {
        return ['status_update', 'delivery_reminder', 'ready_for_pickup', 'general']
    }

    return ['order_registered', 'status_update', 'payment_reminder', 'general']
}

export function openWhatsApp(phone: string, message: string): boolean {
    const url = buildWhatsAppUrl(phone, message)
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
}
