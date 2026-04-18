"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"

export interface DraftLineItem {
    id:          string
    description: string
    quantity:    number
    unitPrice:   number
}

interface Props {
    items:            DraftLineItem[]
    discountAmount:   number
    discountType:     "fixed" | "percent"
    onChange:         (items: DraftLineItem[]) => void
    onDiscountChange: (amount: number, type: "fixed" | "percent") => void
}

export function newLineItem(): DraftLineItem {
    return {
        id:          crypto.randomUUID(),
        description: "",
        quantity:    1,
        unitPrice:   0,
    }
}

export default function LineItemsEditor({
    items, discountAmount, discountType, onChange, onDiscountChange,
}: Props) {
    const subtotal    = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const discountKES = discountType === "percent"
        ? (subtotal * discountAmount) / 100
        : discountAmount
    const total = Math.max(0, subtotal - discountKES)

    const update = (id: string, field: keyof DraftLineItem, value: string | number) =>
        onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i))

    const remove = (id: string) => onChange(items.filter(i => i.id !== id))

    const add = () => onChange([...items, newLineItem()])

    return (
        <div className="space-y-3">

            {/* ── Desktop column headers ─────────────────────────── */}
            {items.length > 0 && (
                <div
                    className="hidden sm:grid gap-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    style={{ gridTemplateColumns: "1fr 72px 140px 120px 36px" }}
                >
                    <span>Description</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Unit Price (KES)</span>
                    <span className="text-right">Total (KES)</span>
                    <span />
                </div>
            )}

            {/* ── Rows ─────────────────────────────────────────────── */}
            {items.map((item, idx) => (
                <div key={item.id}>
                    {/* Desktop row */}
                    <div
                        className="hidden sm:grid gap-2 items-center bg-[#FAF7F4] rounded-lg p-2 border border-[#EAE0D5]"
                        style={{ gridTemplateColumns: "1fr 72px 140px 120px 36px" }}
                    >
                        <Input
                            value={item.description}
                            onChange={e => update(item.id, "description", e.target.value)}
                            placeholder={`Item ${idx + 1} description`}
                            className="border-2 bg-white text-sm"
                        />
                        <Input
                            type="number" inputMode="numeric" min={1}
                            value={item.quantity}
                            onChange={e => update(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                            className="border-2 bg-white text-sm text-right"
                        />
                        <Input
                            type="number" inputMode="decimal" min={0}
                            value={item.unitPrice || ""}
                            placeholder="0"
                            onChange={e => update(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="border-2 bg-white text-sm text-right"
                        />
                        <p className="text-sm font-semibold text-right pr-1" style={{ color: "#8B5E3C" }}>
                            {(item.quantity * item.unitPrice).toLocaleString("en-KE")}
                        </p>
                        <Button
                            type="button" variant="ghost" size="icon"
                            onClick={() => remove(item.id)}
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <Trash2 size={14} />
                        </Button>
                    </div>

                    {/* Mobile card */}
                    <div className="sm:hidden rounded-lg border border-[#EAE0D5] bg-[#FAF7F4] p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-gray-500">Item {idx + 1}</p>
                            <Button
                                type="button" variant="ghost" size="icon"
                                onClick={() => remove(item.id)}
                                className="h-7 w-7 -mt-0.5 -mr-1 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                                <Trash2 size={13} />
                            </Button>
                        </div>
                        <Input
                            value={item.description}
                            onChange={e => update(item.id, "description", e.target.value)}
                            placeholder={`Description`}
                            className="border-2 bg-white text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Qty</p>
                                <Input
                                    type="number" inputMode="numeric" min={1}
                                    value={item.quantity}
                                    onChange={e => update(item.id, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
                                    className="border-2 bg-white text-sm"
                                />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 mb-1">Unit Price (KES)</p>
                                <Input
                                    type="number" inputMode="decimal" min={0}
                                    value={item.unitPrice || ""}
                                    placeholder="0"
                                    onChange={e => update(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    className="border-2 bg-white text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-xs text-gray-500">Line total</span>
                            <span className="text-sm font-bold" style={{ color: "#8B5E3C" }}>
                                KES {(item.quantity * item.unitPrice).toLocaleString("en-KE")}
                            </span>
                        </div>
                    </div>
                </div>
            ))}

            {/* ── Empty state ───────────────────────────────────────── */}
            {items.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                    <p className="text-sm text-gray-400">No items yet — add your first line item.</p>
                </div>
            )}

            {/* ── Add button ────────────────────────────────────────── */}
            <Button
                type="button" variant="outline" size="sm"
                onClick={add}
                className="border-2 gap-1.5"
            >
                <Plus size={14} /> Add Item
            </Button>

            {/* ── Totals ───────────────────────────────────────────── */}
            {items.length > 0 && (
                <div className="flex flex-col items-end gap-2 pt-3 border-t border-gray-200 mt-2">
                    <div className="w-full sm:max-w-[340px] space-y-2 text-sm">

                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-semibold">KES {subtotal.toLocaleString("en-KE")}</span>
                        </div>

                        {/* Discount input */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 shrink-0 w-16">Discount</span>
                            <Select
                                value={discountType}
                                onValueChange={v => onDiscountChange(discountAmount, v as "fixed" | "percent")}
                            >
                                <SelectTrigger className="border-2 w-20 h-8 text-xs shrink-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">KES</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number" inputMode="decimal"
                                value={discountAmount || ""}
                                placeholder="0"
                                onChange={e => onDiscountChange(parseFloat(e.target.value) || 0, discountType)}
                                className="border-2 h-8 text-xs text-right"
                            />
                        </div>

                        {discountKES > 0 && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>Discount</span>
                                <span>– KES {discountKES.toLocaleString("en-KE")}</span>
                            </div>
                        )}

                        <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-2">
                            <span>Total</span>
                            <span style={{ color: "#8B5E3C" }}>KES {total.toLocaleString("en-KE")}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
