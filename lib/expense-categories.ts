export const EXPENSE_CATEGORIES = [
    { value: 'fabric', label: 'Fabric / Material', shortLabel: 'Fabric' },
    { value: 'thread', label: 'Thread / Yarn', shortLabel: 'Thread' },
    { value: 'needles', label: 'Needles / Pins', shortLabel: 'Needles' },
    { value: 'buttons', label: 'Buttons / Zippers', shortLabel: 'Buttons' },
    { value: 'lining', label: 'Lining', shortLabel: 'Lining' },
    { value: 'fuel', label: 'Fuel / Transport', shortLabel: 'Fuel' },
    { value: 'labor', label: 'Labor', shortLabel: 'Labor' },
    { value: 'other', label: 'Other', shortLabel: 'Other' },
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['value']

export function getCategoryLabel(value: string): string {
    return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label || value
}
