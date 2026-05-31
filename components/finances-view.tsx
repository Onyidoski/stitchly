'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Loader2,
    Trash2,
    Receipt,
    Sparkles,
    Camera,
    Zap,
    Wallet,
    CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { QuickExpense } from '@/components/quick-expense'
import { ExpenseReview, type DraftExpense } from '@/components/expense-review'
import { getCategoryLabel } from '@/lib/expense-categories'
import { ExpenseCategoryIcon } from '@/components/expense-category-icon'

interface Expense {
    id: string
    category: string
    description: string | null
    amount: number
    created_at: string
    order_id: string | null
    orders: { fabric_description: string | null } | null
}

const MAX_PHOTO_BYTES = 5_000_000

export function FinancesView({ initialExpenses }: { initialExpenses: Expense[] }) {
    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
    const [deleting, setDeleting] = useState<string | null>(null)

    const [text, setText] = useState('')
    const [parsing, setParsing] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [saving, setSaving] = useState(false)
    const [draft, setDraft] = useState<DraftExpense[] | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const refetch = useCallback(async () => {
        const { data } = await supabase
            .from('expenses')
            .select('*, orders(fabric_description)')
            .order('created_at', { ascending: false })
        if (data) setExpenses(data as Expense[])
    }, [supabase])

    // --- Summary numbers ---
    const now = new Date()
    const totalSpend = expenses.reduce((s, e) => s + Number(e.amount), 0)
    const monthSpend = expenses
        .filter((e) => {
            const d = new Date(e.created_at)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        .reduce((s, e) => s + Number(e.amount), 0)
    const globalCount = expenses.filter((e) => !e.order_id).length

    // --- AI text parse ---
    const handleParse = async () => {
        if (!text.trim()) {
            toast.error('Type your expenses first')
            return
        }
        setParsing(true)
        try {
            const res = await fetch('/api/expenses/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            const items: DraftExpense[] = (data.items || []).map((it: DraftExpense) => ({
                category: it.category || 'other',
                description: it.description || '',
                amount: Number(it.amount) || 0,
            }))
            if (items.length === 0) {
                toast.error('Could not find any expenses in that text')
                return
            }
            setDraft(items)
        } catch (e) {
            console.error(e)
            toast.error('Failed to parse expenses')
        } finally {
            setParsing(false)
        }
    }

    // --- Photo scan (notebook, transfer screenshot, price list, etc.) ---
    const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (file.size > MAX_PHOTO_BYTES) {
            toast.error('Image too large (max 5MB)')
            return
        }

        setScanning(true)
        try {
            const image = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })

            const res = await fetch('/api/expenses/scan-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            const items: DraftExpense[] = (data.items || []).map((it: DraftExpense) => ({
                category: it.category || 'other',
                description: it.description || '',
                amount: Number(it.amount) || 0,
            }))
            if (items.length === 0) {
                toast.error('Could not read any prices from that photo. Try a clearer shot or use Type it.')
                return
            }
            setDraft(items)
        } catch (err) {
            console.error(err)
            toast.error('Failed to read photo')
        } finally {
            setScanning(false)
        }
    }

    // --- Bulk insert reviewed drafts ---
    const handleConfirmDraft = async () => {
        if (!draft) return
        const valid = draft.filter((d) => Number(d.amount) > 0)
        if (valid.length === 0) {
            toast.error('Nothing to save')
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

        const rows = valid.map((d) => ({
            order_id: null,
            tenant_id: profile.tenant_id,
            category: d.category,
            description: d.description || null,
            amount: Number(d.amount),
        }))

        const { error } = await supabase.from('expenses').insert(rows)
        if (!error) {
            toast.success(`Added ${rows.length} expense${rows.length !== 1 ? 's' : ''}!`)
            setDraft(null)
            setText('')
            await refetch()
            router.refresh()
        } else {
            console.error(error)
            toast.error('Failed to save expenses')
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        const { error } = await supabase.from('expenses').delete().eq('id', id)
        if (!error) {
            toast.success('Expense removed')
            setExpenses((prev) => prev.filter((e) => e.id !== id))
            router.refresh()
        } else {
            toast.error('Failed to delete expense')
        }
        setDeleting(null)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Spend</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-500">₦{totalSpend.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">₦{monthSpend.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm col-span-2 sm:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Global Expenses</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{globalCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* ADD EXPENSES */}
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="pb-3 px-4 sm:px-6">
                    <CardTitle className="text-base">Add Expenses</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {draft ? (
                        <ExpenseReview
                            items={draft}
                            onChange={setDraft}
                            onConfirm={handleConfirmDraft}
                            onCancel={() => setDraft(null)}
                            saving={saving}
                        />
                    ) : (
                        <Tabs defaultValue="quick" className="gap-4">
                            <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
                                <TabsTrigger
                                    value="quick"
                                    className="flex min-h-[44px] flex-col gap-1 py-2 text-[11px] sm:min-h-0 sm:flex-row sm:gap-1.5 sm:py-1.5 sm:text-xs"
                                >
                                    <Zap className="h-4 w-4 shrink-0" />
                                    <span>Quick</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="text"
                                    className="flex min-h-[44px] flex-col gap-1 py-2 text-[11px] sm:min-h-0 sm:flex-row sm:gap-1.5 sm:py-1.5 sm:text-xs"
                                >
                                    <Sparkles className="h-4 w-4 shrink-0" />
                                    <span>Type it</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="photo"
                                    className="flex min-h-[44px] flex-col gap-1 py-2 text-[11px] sm:min-h-0 sm:flex-row sm:gap-1.5 sm:py-1.5 sm:text-xs"
                                >
                                    <Camera className="h-4 w-4 shrink-0" />
                                    <span className="sm:hidden">Photo</span>
                                    <span className="hidden sm:inline">From photo</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="quick" className="mt-0 pt-2">
                                <QuickExpense onAdded={refetch} />
                            </TabsContent>

                            <TabsContent value="text" className="mt-0 space-y-3 pt-2">
                                <Textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="e.g. bought 2 cartons thread 8000, 5 zippers 1500, fuel 3000"
                                    className="min-h-[100px] text-base sm:min-h-[90px] sm:text-sm"
                                />
                                <Button onClick={handleParse} disabled={parsing} className="h-11 w-full gap-2 sm:h-10">
                                    {parsing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    Parse with AI
                                </Button>
                                <p className="text-center text-xs text-muted-foreground">
                                    Just write what you bought and the prices. We&apos;ll split it into line items.
                                </p>
                            </TabsContent>

                            <TabsContent value="photo" className="mt-0 space-y-3 pt-2">
                                <label className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/40 active:bg-muted/60">
                                    {scanning ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {scanning ? 'Reading photo...' : 'Snap your market list or payment'}
                                    </span>
                                    <span className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
                                        Handwritten notes, transfer screenshot, price on nylon bag, or supplier list — no shop receipt needed
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handlePhoto}
                                        disabled={scanning}
                                    />
                                </label>
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>

            {/* EXPENSE LIST */}
            <Card className="shadow-sm overflow-hidden">
                <CardHeader className="pb-3 px-4 sm:px-6">
                    <CardTitle className="text-base">All Expenses ({expenses.length})</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    {expenses.length > 0 ? (
                        <div className="space-y-1.5">
                            {expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="group/item flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-3 py-3 transition-colors hover:bg-muted/70 sm:items-center sm:py-2.5"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                            <ExpenseCategoryIcon category={expense.category} className="h-4 w-4 text-muted-foreground" />
                                        </span>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm font-medium">
                                                {expense.description || getCategoryLabel(expense.category)}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                <span className="capitalize">{getCategoryLabel(expense.category)}</span>
                                                <span>·</span>
                                                <span>{new Date(expense.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                                        {expense.order_id ? (
                                            <Badge variant="secondary" className="max-w-[88px] truncate text-[10px] sm:max-w-none">
                                                {expense.orders?.fabric_description || 'Order'}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className="border-emerald-200 text-[10px] text-emerald-600 dark:border-emerald-800 dark:text-emerald-400"
                                            >
                                                Global
                                            </Badge>
                                        )}
                                        <span className="text-sm font-semibold text-red-500 whitespace-nowrap">
                                            -₦{Number(expense.amount).toLocaleString()}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 sm:h-7 sm:w-7 sm:opacity-0 sm:group-hover/item:opacity-100"
                                            onClick={() => handleDelete(expense.id)}
                                            disabled={deleting === expense.id}
                                        >
                                            {deleting === expense.id ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border-2 border-dashed py-10 text-center text-sm text-muted-foreground">
                            No expenses recorded yet.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
