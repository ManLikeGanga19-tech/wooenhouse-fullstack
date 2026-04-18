"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import LineItemsEditor, { type DraftLineItem, newLineItem } from "@/components/quotes/LineItemsEditor";

export default function CreateQuotePage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const contactId    = searchParams.get("contactId");

    const [saving,        setSaving]        = useState(false);
    const [lineItems,     setLineItems]     = useState<DraftLineItem[]>([newLineItem()]);
    const [discountType,  setDiscountType]  = useState<"fixed" | "percent">("fixed");
    const [discountInput, setDiscountInput] = useState(0);

    const [form, setForm] = useState({
        customerName:     "",
        customerEmail:    "",
        customerPhone:    "",
        houseType:        "",
        houseSize:        "",
        location:         "",
        placeOfSupply:    "Kenya",
        countryOfSupply:  "Kenya",
        paymentTerms:     "50% deposit upon signing. 50% on completion.",
        deliveryTimeline: "3-6 months from deposit",
        validityDays:     30 as string | number,
        notes:            "",
    });

    useEffect(() => {
        if (!contactId) return;
        api.admin.contacts.getById(contactId)
            .then(r => {
                const c = r.data;
                setForm(prev => ({
                    ...prev,
                    customerName:  c.name,
                    customerEmail: c.email,
                    customerPhone: c.phone ?? "",
                    location:      c.location ?? "",
                }));
            })
            .catch(() => {});
    }, [contactId]);

    const set = (key: string, value: unknown) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const numVal = (v: string | number) =>
        typeof v === "string" ? (parseFloat(v) || 0) : v;

    const computeDiscountKES = (): number => {
        if (discountType === "percent") {
            const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
            return (subtotal * discountInput) / 100;
        }
        return discountInput;
    };

    const handleSave = async () => {
        if (!form.customerName || !form.customerEmail) {
            toast.error("Customer name and email are required");
            return;
        }
        if (lineItems.some(i => !i.description.trim())) {
            toast.error("All line items need a description");
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.admin.quotes.create({
                ...form,
                basePrice:    0,
                discount:     computeDiscountKES(),
                validityDays: numVal(form.validityDays),
                contactId:    contactId ?? undefined,
                lineItems:    lineItems.map(i => ({
                    id:          i.id,
                    description: i.description,
                    quantity:    i.quantity,
                    unitPrice:   i.unitPrice,
                    total:       i.quantity * i.unitPrice,
                })),
            } as never);
            toast.success("Quote saved as draft");
            router.push(qs ? `/dashboard/quotes/${data.id}?${qs}` : `/dashboard/quotes/${data.id}`);
        } catch (err) {
            toast.error("Failed to create quote", {
                description: err instanceof Error ? err.message : undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline" size="icon"
                        onClick={() => router.push(qs ? `/dashboard/quotes?${qs}` : "/dashboard/quotes")}
                        className="border-2 shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: "#8B5E3C" }}>New Quote</h1>
                        <p className="text-xs text-gray-500">Save as draft, then review and send from the quote page</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave} disabled={saving}
                    className="text-white sm:ml-auto"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Save size={16} className="mr-2" />
                    {saving ? "Saving…" : "Save Draft"}
                </Button>
            </div>

            {/* Customer */}
            <div className="rounded-lg border-2 border-gray-200 bg-white p-4 sm:p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Customer Name *</Label>
                        <Input value={form.customerName} onChange={e => set("customerName", e.target.value)} className="border-2" placeholder="Full name" />
                    </div>
                    <div className="space-y-2">
                        <Label>Customer Email *</Label>
                        <Input type="email" value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)} className="border-2" placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)} className="border-2" placeholder="+254 700 000 000" />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={form.location} onChange={e => set("location", e.target.value)} className="border-2" placeholder="e.g. Nairobi, Naivasha" />
                    </div>
                </div>
            </div>

            {/* Project */}
            <div className="rounded-lg border-2 border-gray-200 bg-white p-4 sm:p-6 space-y-4">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Project Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>House Type</Label>
                        <Input value={form.houseType} onChange={e => set("houseType", e.target.value)} className="border-2" placeholder="e.g. 3-bedroom, cabin" />
                    </div>
                    <div className="space-y-2">
                        <Label>House Size</Label>
                        <Input value={form.houseSize} onChange={e => set("houseSize", e.target.value)} className="border-2" placeholder="e.g. 120 sqm" />
                    </div>
                    <div className="space-y-2">
                        <Label>Place of Supply</Label>
                        <Input value={form.placeOfSupply} onChange={e => set("placeOfSupply", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Country of Supply</Label>
                        <Input value={form.countryOfSupply} onChange={e => set("countryOfSupply", e.target.value)} className="border-2" />
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="rounded-lg border-2 border-gray-200 bg-white p-4 sm:p-6 space-y-4">
                <div>
                    <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Line Items</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Add each item, material, or service with its quantity and price.</p>
                </div>
                <LineItemsEditor
                    items={lineItems}
                    discountAmount={discountInput}
                    discountType={discountType}
                    onChange={setLineItems}
                    onDiscountChange={(amount, type) => { setDiscountInput(amount); setDiscountType(type); }}
                />
            </div>

            {/* Terms */}
            <div className="rounded-lg border-2 border-gray-200 bg-white p-4 sm:p-6 space-y-4">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Terms &amp; Notes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Validity (days)</Label>
                        <Input
                            type="number" inputMode="numeric"
                            value={form.validityDays} placeholder="30"
                            onChange={e => set("validityDays", e.target.value)}
                            className="border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Delivery Timeline</Label>
                        <Input value={form.deliveryTimeline} onChange={e => set("deliveryTimeline", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Payment Terms</Label>
                        <Textarea value={form.paymentTerms} onChange={e => set("paymentTerms", e.target.value)} rows={3} className="border-2 resize-none" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Internal Notes</Label>
                        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="border-2 resize-none" placeholder="Internal reference only — not shown on the quote" />
                    </div>
                </div>
            </div>

            {/* Bottom save */}
            <div className="flex justify-end pb-6">
                <Button
                    onClick={handleSave} disabled={saving}
                    className="text-white px-8"
                    style={{ backgroundColor: "#8B5E3C" }}
                >
                    <Save size={16} className="mr-2" />
                    {saving ? "Saving…" : "Save Draft"}
                </Button>
            </div>
        </div>
    );
}
