"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { toast } from "sonner";

type DiscountType = "fixed" | "percent";

export default function CreateQuotePage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const contactId    = searchParams.get("contactId");

    const [saving,        setSaving]        = useState(false);
    const [discountType,  setDiscountType]  = useState<DiscountType>("fixed");
    const [discountInput, setDiscountInput] = useState<string>("");
    const [form, setForm] = useState({
        customerName:     "",
        customerEmail:    "",
        customerPhone:    "",
        houseType:        "",
        houseSize:        "",
        location:         "",
        placeOfSupply:    "Kenya",
        countryOfSupply:  "Kenya",
        basePrice:        "" as string | number,
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

    const numVal = (v: string | number) => typeof v === "string" ? (parseFloat(v) || 0) : v;

    // Compute the KES discount to send to the API
    const computeDiscountKES = (): number => {
        const raw = parseFloat(discountInput) || 0;
        if (discountType === "percent") {
            return (numVal(form.basePrice) * raw) / 100;
        }
        return raw;
    };

    const handleSave = async (send = false) => {
        if (!form.customerName || !form.customerEmail) {
            toast.error("Customer name and email are required");
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.admin.quotes.create({
                ...form,
                basePrice:  numVal(form.basePrice),
                discount:   computeDiscountKES(),
                validityDays: numVal(form.validityDays),
                contactId:  contactId ?? undefined,
                lineItems:  [],
            } as never);
            if (send) {
                await api.admin.quotes.send(data.id);
                toast.success("Quote created and sent!");
            } else {
                toast.success("Quote saved as draft");
            }
            router.push(qs ? `/dashboard/quotes/${data.id}?${qs}` : `/dashboard/quotes/${data.id}`);
        } catch (err) {
            toast.error("Failed to create quote", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.push(qs ? `/dashboard/quotes?${qs}` : "/dashboard/quotes")} className="border-2 shrink-0">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: "#8B5E3C" }}>New Quote</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:ml-auto">
                    <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="border-2 flex-1 sm:flex-none">
                        <Save size={16} className="mr-2" /> Save Draft
                    </Button>
                    <Button onClick={() => handleSave(true)} disabled={saving} className="text-white flex-1 sm:flex-none" style={{ backgroundColor: "#8B5E3C" }}>
                        <Send size={16} className="mr-2" /> {saving ? "Saving..." : "Save & Send"}
                    </Button>
                </div>
            </div>

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

                <Separator />

                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Project & Pricing</h3>
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
                        <Input value={form.placeOfSupply} onChange={e => set("placeOfSupply", e.target.value)} className="border-2" placeholder="e.g. Nairobi" />
                    </div>
                    <div className="space-y-2">
                        <Label>Country of Supply</Label>
                        <Input value={form.countryOfSupply} onChange={e => set("countryOfSupply", e.target.value)} className="border-2" placeholder="e.g. Kenya" />
                    </div>
                    <div className="space-y-2">
                        <Label>Base Price (KES)</Label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            value={form.basePrice}
                            placeholder="0"
                            onChange={e => set("basePrice", e.target.value)}
                            className="border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Discount</Label>
                        <div className="flex gap-2">
                            <Select value={discountType} onValueChange={v => setDiscountType(v as DiscountType)}>
                                <SelectTrigger className="border-2 w-32 shrink-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fixed">KES</SelectItem>
                                    <SelectItem value="percent">%</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                inputMode="decimal"
                                value={discountInput}
                                placeholder={discountType === "percent" ? "0%" : "0"}
                                onChange={e => setDiscountInput(e.target.value)}
                                className="border-2"
                            />
                        </div>
                        {discountType === "percent" && discountInput && (
                            <p className="text-xs text-gray-500">
                                = KES {((numVal(form.basePrice) * (parseFloat(discountInput) || 0)) / 100).toLocaleString("en-KE")}
                            </p>
                        )}
                    </div>
                </div>

                <Separator />

                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Terms & Notes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Validity (days)</Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            value={form.validityDays}
                            placeholder="30"
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
                        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={4} className="border-2 resize-none" placeholder="Any notes for internal reference..." />
                    </div>
                </div>
            </div>
        </div>
    );
}
