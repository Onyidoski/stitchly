'use client'

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, Receipt, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"

const EXPENSE_CATEGORIES = [
    { value: 'fabric', label: 'Fabric / Material' },
    { value: 'thread', label: 'Thread / Yarn' },
    { value: 'needles', label: 'Needles / Pins' },
    { value: 'buttons', label: 'Buttons / Zippers' },
    { value: 'lining', label: 'Lining' },
    { value: 'fuel', label: 'Fuel / Transport' },
    { value: 'labor', label: 'Labor' },
    { value: 'other', label: 'Other' },
]

interface Expense {
    id: string
    category: string
    description: string | null
    amount: number
    created_at: string
}

interface ExpenseManagerProps {
    orderId: string
    orderTotal: number
}

export function ExpenseManager({ orderId, orderTotal }: ExpenseManagerProps) {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [expanded, setExpanded] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [category, setCategory] = useState('fabric')
    const [initialLoad, setInitialLoad] = useState(true)

    const router = useRouter()
    const supabase = createClient()

    const fetchExpenses = useCallback(async () => {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setExpenses(data)
        }
        setInitialLoad(false)
    }, [orderId, supabase])

    useEffect(() => {
        fetchExpenses()
    }, [fetchExpenses])

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const profit = orderTotal - totalExpenses
    const profitPercentage = orderTotal > 0 ? ((profit / orderTotal) * 100).toFixed(0) : '0'

    const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const amount = Number(formData.get('amount'))
        const description = formData.get('description') as string

        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount")
            setLoading(false)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Not authenticated")
            setLoading(false)
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            toast.error("No tenant found")
            setLoading(false)
            return
        }

        const { error } = await supabase.from('expenses').insert({
            order_id: orderId,
            tenant_id: profile.tenant_id,
            category,
            description: description || null,
            amount,
        })

        if (!error) {
            toast.success("Expense added!")
            setShowForm(false)
            setCategory('fabric')
            await fetchExpenses()
            router.refresh()
        } else {
            console.error(error)
            toast.error("Failed to add expense")
        }

        setLoading(false)
    }

    const handleDeleteExpense = async (expenseId: string) => {
        setDeleting(expenseId)

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId)

        if (!error) {
            toast.success("Expense removed")
            await fetchExpenses()
            router.refresh()
        } else {
            toast.error("Failed to delete expense")
        }

        setDeleting(null)
    }

    const getCategoryLabel = (value: string) =>
        EXPENSE_CATEGORIES.find(c => c.value === value)?.label || value

    const getCategoryEmoji = (value: string) => {
        switch (value) {
            case 'fabric': return '🧵'
            case 'thread': return '🪡'
            case 'needles': return '📌'
            case 'buttons': return '🔘'
            case 'lining': return '📐'
            case 'fuel': return '⛽'
            case 'labor': return '👷'
            default: return '📦'
        }
    }

    if (initialLoad) return null

    return (
        <div className="border-t pt-3 mt-1">
            {/* SUMMARY BAR - Always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-1 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
                <div className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                        Expenses ({expenses.length})
                    </span>
                    {totalExpenses > 0 && (
                        <span className="text-xs font-semibold text-red-500">
                            -₦{totalExpenses.toLocaleString()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {orderTotal > 0 && (
                        <span className={`text-xs font-bold flex items-center gap-1 ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {profit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            ₦{profit.toLocaleString()} ({profitPercentage}%)
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                </div>
            </button>

            {/* EXPANDED CONTENT */}
            {expanded && (
                <div className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {/* Expense List */}
                    {expenses.length > 0 ? (
                        <div className="space-y-1.5">
                            {expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 group/item hover:bg-muted/70 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="text-sm shrink-0">{getCategoryEmoji(expense.category)}</span>
                                        <div className="min-w-0">
                                            <div className="text-xs font-medium truncate">
                                                {expense.description || getCategoryLabel(expense.category)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground capitalize">
                                                {getCategoryLabel(expense.category)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs font-semibold text-red-500">
                                            -₦{Number(expense.amount).toLocaleString()}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                                            onClick={() => handleDeleteExpense(expense.id)}
                                            disabled={deleting === expense.id}
                                        >
                                            {deleting === expense.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3 w-3" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-3 text-xs text-muted-foreground">
                            No expenses recorded yet
                        </div>
                    )}

                    {/* Add Expense Form */}
                    {showForm ? (
                        <form onSubmit={handleAddExpense} className="space-y-3 p-3 rounded-xl border bg-card shadow-sm animate-in fade-in duration-200">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {EXPENSE_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value} className="text-xs">
                                                    {getCategoryEmoji(cat.value)} {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Amount (₦)</Label>
                                    <Input
                                        name="amount"
                                        type="number"
                                        placeholder="0"
                                        className="h-8 text-xs"
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Description (optional)</Label>
                                <Input
                                    name="description"
                                    placeholder="e.g. 3 yards of Ankara"
                                    className="h-8 text-xs"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" size="sm" className="h-7 text-xs flex-1" disabled={loading}>
                                    {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                    Add Expense
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs gap-1.5 border-dashed"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus className="h-3 w-3" />
                            Add Expense
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
