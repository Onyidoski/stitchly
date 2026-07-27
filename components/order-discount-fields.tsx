'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getDiscountLabel,
  getDiscountNaira,
  getOrderNet,
  type DiscountType,
} from '@/lib/order-money'

type DiscountFieldsProps = {
  /** Controlled subtotal (create form) or fixed order total (edit). */
  totalAmount: number
  defaultType?: DiscountType | string | null
  defaultValue?: number | null
  /** When provided, parent owns type/value state (e.g. edit sheet). */
  type?: DiscountType | string | null
  value?: number
  onTypeChange?: (type: DiscountType) => void
  onValueChange?: (value: number) => void
  /** Hidden inputs for uncontrolled form submit (add order). */
  useHiddenInputs?: boolean
}

export function OrderDiscountFields({
  totalAmount,
  defaultType = null,
  defaultValue = 0,
  type: controlledType,
  value: controlledValue,
  onTypeChange,
  onValueChange,
  useHiddenInputs = false,
}: DiscountFieldsProps) {
  const [internalType, setInternalType] = useState<DiscountType>(
    (defaultType as DiscountType) || null
  )
  const [internalValue, setInternalValue] = useState(Number(defaultValue) || 0)

  const isControlled = controlledType !== undefined
  const discountType = (isControlled ? controlledType : internalType) as DiscountType
  const discountValue = isControlled ? Number(controlledValue ?? 0) : internalValue

  const setType = (next: DiscountType) => {
    if (!isControlled) setInternalType(next)
    onTypeChange?.(next)
    if (!next) {
      if (!isControlled) setInternalValue(0)
      onValueChange?.(0)
    }
  }

  const setValue = (next: number) => {
    if (!isControlled) setInternalValue(next)
    onValueChange?.(next)
  }

  const preview = useMemo(() => {
    const order = {
      total_amount: totalAmount,
      discount_type: discountType,
      discount_value: discountValue,
    }
    return {
      discount: getDiscountNaira(order),
      net: getOrderNet(order),
      label: getDiscountLabel(order),
    }
  }, [totalAmount, discountType, discountValue])

  const selectValue = discountType === 'fixed' || discountType === 'percent' ? discountType : 'none'

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      {useHiddenInputs && (
        <>
          <input type="hidden" name="discount_type" value={discountType || ''} />
          <input type="hidden" name="discount_value" value={discountValue || 0} />
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Discount</Label>
          <Select
            value={selectValue}
            onValueChange={(v) => {
              if (v === 'none') setType(null)
              else setType(v as DiscountType)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="No discount" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No discount</SelectItem>
              <SelectItem value="fixed">Fixed amount (₦)</SelectItem>
              <SelectItem value="percent">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {discountType && (
          <div className="space-y-2">
            <Label htmlFor="discount_value_input">
              {discountType === 'percent' ? 'Percent off' : 'Amount off (₦)'}
            </Label>
            <Input
              id="discount_value_input"
              type="number"
              min={0}
              max={discountType === 'percent' ? 100 : undefined}
              step={discountType === 'percent' ? 0.1 : 1}
              value={discountValue || ''}
              placeholder={discountType === 'percent' ? '10' : '5000'}
              onChange={(e) => setValue(Number(e.target.value) || 0)}
            />
          </div>
        )}
      </div>

      {totalAmount > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>
            Subtotal: <span className="font-medium text-foreground">₦{totalAmount.toLocaleString()}</span>
          </span>
          {preview.discount > 0 && (
            <span>
              Discount: <span className="font-medium text-foreground">{preview.label}</span>
            </span>
          )}
          <span>
            Net: <span className="font-medium text-foreground">₦{Math.round(preview.net).toLocaleString()}</span>
          </span>
        </div>
      )}
    </div>
  )
}
