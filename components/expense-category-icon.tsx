'use client'

import {
    CircleDot,
    Fuel,
    HardHat,
    Layers,
    Link2,
    Package,
    Pin,
    Ruler,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
    fabric: Layers,
    thread: Link2,
    needles: Pin,
    buttons: CircleDot,
    lining: Ruler,
    fuel: Fuel,
    labor: HardHat,
    other: Package,
}

export function ExpenseCategoryIcon({
    category,
    className,
}: {
    category: string
    className?: string
}) {
    const Icon = CATEGORY_ICONS[category] ?? Package
    return <Icon className={cn('h-3.5 w-3.5 shrink-0', className)} aria-hidden />
}
