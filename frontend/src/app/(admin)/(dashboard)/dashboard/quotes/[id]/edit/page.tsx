"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api, type Quote } from "@/lib/api/client";
import { toast } from "sonner";

type DiscountType = "fixed" | "percent";

export default function EditQuotePage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const { id }       = useParams<{ id: string }>();

    const [quote,         setQuote]         = useState<Quote | null>(null);
    const [loading,       setLoading]       = useState(true);
    const [saving,        setSaving]        = useState(false);
    const [form,          setForm]          = useState<Partial<Quote>>({});
    const [discountType,  setDiscountType]  = useState<DiscountType>("fixed");
    const [discountInput, setDiscountInput] = useState<string>("");

    useEffect(() => {
        api.admin.quotes.getById(id)
            .then(r => {
                setQuote(r.data);
                setForm(r.data);
                // Pre-fill discount as fixed (existing KES amount)
                setDiscountInput(r.data.discount > 0 ? String(r.data.discount) : "");
            })
            .catch(() => toast.error("Quote not found"))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (key: keyof Quote, value: unknown) =>
        setForm(prev => ({ ...prev, [key]: value }));

    const numVal = (v: string | number | undefined) =>
        typeof v === "string" ? (parseFloat(v) || 0) : (v ?? 0);

    const computeDiscountKES = (): number => {
        const raw = parseFloat(discountInput) || 0;
        if (discountType === "percent") {
            return (numVal(form.basePrice) * raw) / 100;
        }
        return raw;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.admin.quotes.update(id, {
                ...form,
                basePrice:    numVal(form.basePrice),
                discount:     computeDiscountKES(),
                validityDays: numVal(form.validityDays),
            });
            toast.success("Quote updated");
            router.push(qs ? `/dashboard/quotes/${id}?${qs}` : `/dashboard/quotes/${id}`);
        } catch (err) {
            toast.error("Failed to save", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-96 rounded-lg bg-gray-100 animate-pulse" />;

    if (!quote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-xl font-semibold mb-2">Quote not found</p>
                <Button onClick={() => router.push(qs ? `/dashboard/quotes?${qs}` : "/dashboard/quotes")}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Quotes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.push(qs ? `/dashboard/quotes/${id}?${qs}` : `/dashboard/quotes/${id}`)} className="border-2 shrink-0">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: "#8B5E3C" }}>Edit Quote</h1>
                        <p className="text-sm text-gray-500">#{quote.quoteNumber}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="text-white sm:ml-auto" style={{ backgroundColor: "#8B5E3C" }}>
                    <Save size={16} className="mr-2" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="rounded-lg border-2 border-gray-200 bg-white p-4 sm:p-6 space-y-6">
                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Customer Name *</Label>
                        <Input value={form.customerName ?? ""} onChange={e => set("customerName", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Customer Email *</Label>
                        <Input type="email" value={form.customerEmail ?? ""} onChange={e => set("customerEmail", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Customer Phone</Label>
                        <Input value={form.customerPhone ?? ""} onChange={e => set("customerPhone", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={form.location ?? ""} onChange={e => set("location", e.target.value)} className="border-2" />
                    </div>
                </div>

                <Separator />

                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Project & Pricing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>House Type</Label>
                        <Input value={form.houseType ?? ""} onChange={e => set("houseType", e.target.value)} className="border-2" placeholder="e.g. 3-bedroom, cabin" />
                    </div>
                    <div className="space-y-2">
                        <Label>House Size</Label>
                        <Input value={form.houseSize ?? ""} onChange={e => set("houseSize", e.target.value)} className="border-2" placeholder="e.g. 120 sqm" />
                    </div>
                    <div className="space-y-2">
                        <Label>Place of Supply</Label>
                        <Input value={form.placeOfSupply ?? ""} onChange={e => set("placeOfSupply", e.target.value)} className="border-2" placeholder="e.g. Nairobi" />
                    </div>
                    <div className="space-y-2">
                        <Label>Country of Supply</Label>
                        <Input value={form.countryOfSupply ?? ""} onChange={e => set("countryOfSupply", e.target.value)} className="border-2" placeholder="e.g. Kenya" />
                    </div>
                    <div className="space-y-2">
                        <Label>Base Price (KES)</Label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            value={form.basePrice ?? ""}
                            placeholder="0"
                            onChange={e => set("basePrice", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                            className="border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Discount</Label>
                        <div className="flex gap-2">
                            <Select value={discountType} onValueChange={v => setDiscountType(v as DiscountType)}>
                                <SelectTrigger className="border-2 w-28 shrink-0">
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

                <h3 className="font-semibold text-lg" style={{ color: "#8B5E3C" }}>Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Validity (days)</Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            value={form.validityDays ?? ""}
                            placeholder="30"
                            onChange={e => set("validityDays", e.target.value === "" ? 30 : parseInt(e.target.value) || 30)}
                            className="border-2"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={form.status ?? "draft"} onValueChange={v => set("status", v)}>
                            <SelectTrigger className="border-2"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {["draft","sent","viewed","accepted","rejected","expired"].map(v => (
                                    <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Payment Terms</Label>
                        <Textarea value={form.paymentTerms ?? ""} onChange={e => set("paymentTerms", e.target.value)} rows={3} className="border-2 resize-none" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Delivery Timeline</Label>
                        <Input value={form.deliveryTimeline ?? ""} onChange={e => set("deliveryTimeline", e.target.value)} className="border-2" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <Label>Notes</Label>
                        <Textarea value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} rows={4} className="border-2 resize-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
