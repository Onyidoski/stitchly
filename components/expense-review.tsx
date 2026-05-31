'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Trash2, Plus } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/lib/expense-categories'
import { ExpenseCategoryIcon } from '@/components/expense-category-icon'

export interface DraftExpense {
    category: string
    description: string
    amount: number
}

interface ExpenseReviewProps {
    items: DraftExpense[]
    onChange: (items: DraftExpense[]) => void
    onConfirm: () => void
    onCancel: () => void
    saving: boolean
}

export function ExpenseReview({ items, onChange, onConfirm, onCancel, saving }: ExpenseReviewProps) {
    const update = (index: number, patch: Partial<DraftExpense>) => {
        onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
    }

    const remove = (index: number) => {
        onChange(items.filter((_, i) => i !== index))
    }

    const addRow = () => {
        onChange([...items, { category: 'other', description: '', amount: 0 }])
    }

    const total = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
    const hasValid = items.some((it) => Number(it.amount) > 0)

    return (
        <div className="space-y-3 rounded-xl border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Review {items.length} item{items.length !== 1 ? 's' : ''}
                </p>
                <span className="text-xs font-bold text-red-500">-₦{total.toLocaleString()}</span>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="space-y-2 rounded-lg border bg-muted/20 p-3 sm:flex sm:items-center sm:gap-2 sm:space-y-0 sm:border-0 sm:bg-transparent sm:p-0"
                    >
                        <Select
                            value={item.category}
                            onValueChange={(value) => update(index, { category: value })}
                        >
                            <SelectTrigger className="h-10 w-full text-sm sm:h-8 sm:w-[120px] sm:shrink-0 sm:text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                        <span className="flex items-center gap-2">
                                            <ExpenseCategoryIcon category={cat.value} />
                                            {cat.shortLabel}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2 sm:min-w-0 sm:flex-1">
                            <Input
                                value={item.description}
                                onChange={(e) => update(index, { description: e.target.value })}
                                placeholder="Description"
                                className="h-10 min-w-0 flex-1 text-base sm:h-8 sm:text-xs"
                            />
                            <Input
                                type="number"
                                inputMode="decimal"
                                value={item.amount || ''}
                                onChange={(e) => update(index, { amount: Number(e.target.value) })}
                                placeholder="₦"
                                min="0"
                                className="h-10 w-24 shrink-0 text-base sm:h-8 sm:w-24 sm:text-xs"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 shrink-0 p-0 text-muted-foreground hover:text-red-500 sm:h-8 sm:w-8"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-full gap-1.5 border-dashed text-xs"
                onClick={addRow}
            >
                <Plus className="h-3 w-3" />
                Add row
            </Button>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-11 w-full text-sm sm:h-8 sm:w-auto sm:text-xs"
                    onClick={onCancel}
                    disabled={saving}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="h-11 flex-1 text-sm sm:h-8 sm:text-xs"
                    onClick={onConfirm}
                    disabled={saving || !hasValid}
                >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save {items.length} expense{items.length !== 1 ? 's' : ''}
                </Button>
            </div>
        </div>
    )
}
