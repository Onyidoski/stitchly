'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { EXPENSE_CATEGORIES } from '@/lib/expense-categories'
import { ExpenseCategoryIcon } from '@/components/expense-category-icon'
import { cn } from '@/lib/utils'

interface QuickExpenseProps {
    onAdded?: () => void
    compact?: boolean
}

export function QuickExpense({ onAdded, compact = false }: QuickExpenseProps) {
    const [category, setCategory] = useState<string>('fabric')
    const [amount, setAmount] = useState('')
    const [saving, setSaving] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    const handleAdd = async () => {
        const value = Number(amount)
        if (!value || value <= 0) {
            toast.error('Enter an amount')
            return
        }

        setSaving(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            toast.error('Not authenticated')
            setSaving(false)
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            toast.error('No tenant found')
            setSaving(false)
            return
        }

        const { error } = await supabase.from('expenses').insert({
            order_id: null,
            tenant_id: profile.tenant_id,
            category,
            description: null,
            amount: value,
        })

        if (!error) {
            toast.success('Expense added!')
            setAmount('')
            onAdded?.()
            router.refresh()
        } else {
            console.error(error)
            toast.error('Failed to add expense')
        }

        setSaving(false)
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {!compact && (
                    <Label className="text-xs text-muted-foreground">Category</Label>
                )}
                <div
                    className={cn(
                        'grid gap-2',
                        compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
                    )}
                >
                    {EXPENSE_CATEGORIES.map((cat) => {
                        const selected = category === cat.value
                        return (
                            <button
                                key={cat.value}
                                type="button"
                                onClick={() => setCategory(cat.value)}
                                className={cn(
                                    'flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors touch-manipulation',
                                    selected
                                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                        : 'border-border bg-muted/30 text-muted-foreground active:bg-muted'
                                )}
                            >
                                <ExpenseCategoryIcon
                                    category={cat.value}
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        selected ? 'opacity-95' : 'opacity-70'
                                    )}
                                />
                                <span className="truncate">{cat.shortLabel}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor="quick-expense-amount" className="text-xs text-muted-foreground">
                        Amount (₦)
                    </Label>
                    <Input
                        id="quick-expense-amount"
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd()
                        }}
                        placeholder="0"
                        min="1"
                        className="h-11 text-base sm:h-10 sm:text-sm"
                    />
                </div>
                <Button
                    onClick={handleAdd}
                    disabled={saving}
                    className="h-11 w-full shrink-0 gap-2 sm:h-10 sm:w-auto sm:min-w-[100px]"
                >
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Zap className="h-4 w-4" />
                    )}
                    Add expense
                </Button>
            </div>
        </div>
    )
}
