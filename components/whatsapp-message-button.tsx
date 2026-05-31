'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
    buildWhatsAppMessage,
    formatPhoneForWhatsApp,
    getSuggestedTemplates,
    getWhatsAppTemplateLabel,
    openWhatsApp,
    type WhatsAppMessageContext,
    type WhatsAppTemplateId,
} from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

interface WhatsAppMessageButtonProps {
    phone: string | null | undefined
    context: WhatsAppMessageContext
    /** If set, only these templates are shown (in order). */
    templates?: WhatsAppTemplateId[]
    variant?: 'default' | 'outline' | 'secondary' | 'ghost'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    label?: string
    className?: string
    showIcon?: boolean
}

export function WhatsAppMessageButton({
    phone,
    context,
    templates,
    variant = 'outline',
    size = 'sm',
    label = 'WhatsApp',
    className,
    showIcon = true,
}: WhatsAppMessageButtonProps) {
    const normalized = formatPhoneForWhatsApp(phone)
    const templateIds = templates ?? getSuggestedTemplates(context)

    const handleSend = (templateId: WhatsAppTemplateId) => {
        if (!phone?.trim() || !normalized) {
            toast.error('Add a valid phone number for this client first')
            return
        }
        try {
            const message = buildWhatsAppMessage(templateId, context)
            openWhatsApp(phone, message)
        } catch {
            toast.error('Could not open WhatsApp. Check the phone number.')
        }
    }

    if (size === 'icon') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant={variant}
                        size="icon"
                        className={cn('h-8 w-8 shrink-0', className)}
                        disabled={!normalized}
                        title={normalized ? 'Message on WhatsApp' : 'No valid phone number'}
                    >
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">WhatsApp</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <TemplateMenuItems templateIds={templateIds} onSelect={handleSend} />
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant={variant}
                    size={size}
                    className={cn('gap-1.5', className)}
                    disabled={!normalized}
                >
                    {showIcon && <MessageCircle className="h-4 w-4" />}
                    {label}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <TemplateMenuItems templateIds={templateIds} onSelect={handleSend} />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function TemplateMenuItems({
    templateIds,
    onSelect,
}: {
    templateIds: WhatsAppTemplateId[]
    onSelect: (id: WhatsAppTemplateId) => void
}) {
    return (
        <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
                Choose a message
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {templateIds.map((id) => (
                <DropdownMenuItem
                    key={id}
                    className="cursor-pointer text-sm"
                    onClick={() => onSelect(id)}
                >
                    {getWhatsAppTemplateLabel(id)}
                </DropdownMenuItem>
            ))}
        </>
    )
}
