"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Printer, Send, Edit, Download, FileText, Bot, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type Quote } from "@/lib/api/client";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_OPTIONS = ["draft", "sent", "viewed", "accepted", "rejected", "expired"];

const STATUS_COLOR: Record<string, string> = {
    draft:    "#6B7280",
    sent:     "#3B82F6",
    viewed:   "#F59E0B",
    accepted: "#10B981",
    rejected: "#EF4444",
    expired:  "#9CA3AF",
};

export default function ViewQuotePage() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const qs           = searchParams.toString();
    const { id }       = useParams<{ id: string }>();

    const [quote,          setQuote]          = useState<Quote | null>(null);
    const [loading,        setLoading]        = useState(true);
    const [sending,          setSending]          = useState(false);
    const [generatingCover,  setGeneratingCover]  = useState(false);
    const [updatingStatus,   setUpdatingStatus]   = useState(false);

    useEffect(() => {
        api.admin.quotes.getById(id)
            .then(r => setQuote(r.data))
            .catch(() => toast.error("Quote not found"))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSend = async () => {
        if (!quote) return;
        setSending(true);
        try {
            await api.admin.quotes.send(id);
            setQuote({ ...quote, status: "sent" });
            toast.success("Quote sent to customer");
        } catch (err) {
            toast.error("Failed to send quote", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setSending(false);
        }
    };

    const handleGenerateCover = async () => {
        if (!quote) return;
        setGeneratingCover(true);
        try {
            await api.admin.agents.generateQuoteCover(id);
            toast.success("AI cover email drafted", {
                description: "Review and approve it in the Agents queue before it sends.",
                action: { label: "View Queue", onClick: () => router.push("/dashboard/agents/queue") },
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to generate cover"
            toast.error(msg.includes("already has") ? "Cover already drafted" : msg, {
                description: msg.includes("already has") ? "Check the approval queue." : undefined,
            });
        } finally {
            setGeneratingCover(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!quote || newStatus === quote.status) return;
        setUpdatingStatus(true);
        try {
            await api.admin.quotes.update(id, { ...quote, status: newStatus });
            setQuote({ ...quote, status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            toast.error("Failed to update status", { description: err instanceof Error ? err.message : undefined });
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) return <div className="h-96 rounded-lg bg-gray-100 animate-pulse" />;

    if (!quote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-xl font-semibold mb-4">Quote not found</p>
                <Button onClick={() => router.push(qs ? `/dashboard/quotes?${qs}` : "/dashboard/quotes")}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Quotes
                </Button>
            </div>
        );
    }

    const subtotal   = quote.lineItems?.length
        ? quote.lineItems.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
        : quote.basePrice;
    const discount   = quote.discount ?? 0;
    const finalPrice = quote.finalPrice ?? Math.max(0, subtotal - discount);

    return (
        <div className="space-y-4">
            {/* ── Action toolbar ── */}
            <div className="flex items-center gap-2 print:hidden flex-wrap">
                <Button variant="outline" size="icon" onClick={() => router.push(qs ? `/dashboard/quotes?${qs}` : "/dashboard/quotes")} className="border-2 shrink-0">
                    <ArrowLeft size={18} />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold truncate" style={{ color: "#8B5E3C" }}>
                        Quote #{quote.quoteNumber}
                    </h1>
                </div>

                {/* Status selector */}
                <Select value={quote.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
                    <SelectTrigger
                        className="w-32 border-2 font-semibold text-white shrink-0"
                        style={{ backgroundColor: STATUS_COLOR[quote.status] ?? "#6B7280", borderColor: STATUS_COLOR[quote.status] ?? "#6B7280" }}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                            <SelectItem key={s} value={s}>
                                <span className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {quote.status === "draft" && (
                    <>
                        <Button
                            onClick={handleGenerateCover}
                            disabled={generatingCover}
                            variant="outline"
                            className="border-2 shrink-0"
                            style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}
                            title="Draft a personalised AI cover email for this quote"
                        >
                            {generatingCover
                                ? <Clock size={16} className="sm:mr-2 animate-spin" />
                                : <Bot size={16} className="sm:mr-2" />}
                            <span className="hidden sm:inline">{generatingCover ? "Drafting..." : "AI Cover"}</span>
                        </Button>
                        <Button onClick={handleSend} disabled={sending} className="text-white shrink-0" style={{ backgroundColor: "#8B5E3C" }}>
                            <Send size={16} className="mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{sending ? "Sending..." : "Send"}</span>
                            <span className="sm:hidden">{sending ? "..." : "Send"}</span>
                        </Button>
                    </>
                )}
                <Button variant="outline" onClick={() => router.push(qs ? `/dashboard/quotes/${id}/edit?${qs}` : `/dashboard/quotes/${id}/edit`)} className="border-2 shrink-0">
                    <Edit size={16} className="sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="border-2 shrink-0">
                    <Printer size={16} className="sm:mr-2" />
                    <span className="hidden sm:inline">Print / PDF</span>
                </Button>
            </div>

            {/* ── MOBILE SUMMARY (shown only on small screens, hidden on desktop & print) ── */}
            <div className="md:hidden print:hidden space-y-4">
                <div className="rounded-xl border-2 border-gray-200 bg-white p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide">Quote</p>
                            <p className="font-bold text-lg" style={{ color: "#8B5E3C" }}>{quote.quoteNumber}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: STATUS_COLOR[quote.status] ?? "#6B7280" }}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                        </span>
                    </div>

                    <div className="divide-y divide-gray-100 text-sm">
                        <div className="py-2 flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="font-medium text-right max-w-[55%] truncate">{quote.customerName}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium text-right max-w-[55%] truncate">{quote.customerEmail}</span>
                        </div>
                        {quote.location && (
                            <div className="py-2 flex justify-between">
                                <span className="text-gray-500">Location</span>
                                <span className="font-medium">{quote.location}</span>
                            </div>
                        )}
                        {quote.houseType && (
                            <div className="py-2 flex justify-between">
                                <span className="text-gray-500">Project</span>
                                <span className="font-medium text-right">{quote.houseType}{quote.houseSize ? ` · ${quote.houseSize}` : ""}</span>
                            </div>
                        )}
                        <div className="py-2 flex justify-between">
                            <span className="text-gray-500">Sub Total</span>
                            <span className="font-medium">KES {subtotal.toLocaleString("en-KE")}</span>
                        </div>
                        {discount > 0 && (
                            <div className="py-2 flex justify-between">
                                <span className="text-gray-500">Discount</span>
                                <span className="font-medium text-green-600">– KES {discount.toLocaleString("en-KE")}</span>
                            </div>
                        )}
                        <div className="py-2 flex justify-between">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-base" style={{ color: "#8B5E3C" }}>KES {finalPrice.toLocaleString("en-KE")}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-medium">{format(new Date(quote.createdAt), "MMM d, yyyy")}</span>
                        </div>
                        {quote.validityDays && (
                            <div className="py-2 flex justify-between">
                                <span className="text-gray-500">Valid until</span>
                                <span className="font-medium">
                                    {format(new Date(new Date(quote.createdAt).getTime() + quote.validityDays * 86400000), "MMM d, yyyy")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile download note */}
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center space-y-3">
                    <FileText size={36} className="mx-auto text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Full A4 quote preview is available on desktop</p>
                    <p className="text-xs text-gray-400">Open this page on a larger screen to view and print the quotation document</p>
                    <Button
                        onClick={() => window.print()}
                        className="text-white mt-2"
                        style={{ backgroundColor: "#8B5E3C" }}
                    >
                        <Download size={16} className="mr-2" /> Download PDF
                    </Button>
                </div>
            </div>

            {/* ── A4 Quote Document (hidden on mobile, shown on desktop and print) ── */}
            <div id="quote-document" className="quote-a4 bg-white mx-auto hidden md:flex print:flex">

                {/* TITLE */}
                <h1 className="quote-title">Quotation</h1>

                {/* LOGO + QUOTE META */}
                <div className="quote-header-row">
                    <div className="quote-logo-block">
                        <Image
                            src="/woodenhouse-logo.jpg"
                            alt="Wooden Houses Kenya"
                            width={56}
                            height={56}
                            className="quote-logo-img"
                            unoptimized
                        />
                        <div className="quote-company-name">
                            <span className="quote-company-title">WOODEN HOUSES</span>
                            <span className="quote-company-sub">KENYA</span>
                        </div>
                    </div>
                    <div className="quote-meta">
                        <div className="quote-meta-row">
                            <span className="quote-meta-label">Quotation #</span>
                            <span className="quote-meta-value">{quote.quoteNumber}</span>
                        </div>
                        <div className="quote-meta-row">
                            <span className="quote-meta-label">Quotation Date</span>
                            <span className="quote-meta-value">{format(new Date(quote.createdAt), "MMM dd, yyyy").toUpperCase()}</span>
                        </div>
                        {quote.validityDays && (
                            <div className="quote-meta-row">
                                <span className="quote-meta-label">Valid Until</span>
                                <span className="quote-meta-value">
                                    {format(new Date(new Date(quote.createdAt).getTime() + quote.validityDays * 86400000), "MMM dd, yyyy").toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* QUOTATION BY / TO */}
                <div className="quote-parties">
                    <div className="quote-party-box">
                        <div className="quote-party-header">Quotation by</div>
                        <div className="quote-party-body">
                            <p className="quote-party-name">Wooden Houses Kenya</p>
                            <p>Naivasha, Kenya</p>
                            <p>+254 716 111 187 / +254 789 104 438</p>
                            <p>info@woodenhouseskenya.com</p>
                            <p>woodenhouseskenya.com</p>
                        </div>
                    </div>
                    <div className="quote-party-box">
                        <div className="quote-party-header">Quotation to</div>
                        <div className="quote-party-body">
                            <p className="quote-party-name">{quote.customerName}</p>
                            {quote.location && <p>{quote.location}</p>}
                            {quote.customerPhone && <p>{quote.customerPhone}</p>}
                            <p>{quote.customerEmail}</p>
                            {quote.houseType && <p>Project: {quote.houseType}{quote.houseSize ? ` — ${quote.houseSize}` : ""}</p>}
                        </div>
                    </div>
                </div>

                {/* SUPPLY ROW */}
                <div className="quote-supply-row">
                    <span>Place of Supply&nbsp; <strong>{quote.placeOfSupply || "Kenya"}</strong></span>
                    <span>Country of Supply&nbsp; <strong>{quote.countryOfSupply || "Kenya"}</strong></span>
                </div>

                {/* LINE ITEMS TABLE */}
                <table className="quote-table">
                    <thead>
                        <tr>
                            <th className="quote-th quote-th-desc">Item # / Item Description</th>
                            <th className="quote-th quote-th-num">Qty.</th>
                            <th className="quote-th quote-th-num">Rate (KES)</th>
                            <th className="quote-th quote-th-num">Amount (KES)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.lineItems?.length > 0 ? (
                            quote.lineItems.map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? "quote-row-white" : "quote-row-cream"}>
                                    <td className="quote-td-desc">{idx + 1}.&nbsp; {item.description}</td>
                                    <td className="quote-td-num">{item.quantity}</td>
                                    <td className="quote-td-num">{item.unitPrice.toLocaleString("en-KE")}</td>
                                    <td className="quote-td-num">{(item.quantity * item.unitPrice).toLocaleString("en-KE")}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="quote-row-white">
                                <td className="quote-td-desc">1.&nbsp; {quote.houseType || "Wooden House Construction"}{quote.houseSize ? ` (${quote.houseSize})` : ""}</td>
                                <td className="quote-td-num">1</td>
                                <td className="quote-td-num">{quote.basePrice.toLocaleString("en-KE")}</td>
                                <td className="quote-td-num">{quote.basePrice.toLocaleString("en-KE")}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* BOTTOM SECTION */}
                <div className="quote-bottom">
                    <div className="quote-bottom-left">
                        {quote.paymentTerms && (
                            <>
                                <h3 className="quote-section-heading">Terms and Conditions</h3>
                                <ol className="quote-terms-list">
                                    {quote.paymentTerms.split(/\n|\.(?=\s)/).filter(Boolean).map((t, i) => (
                                        <li key={i}>{t.trim()}</li>
                                    ))}
                                </ol>
                            </>
                        )}
                        {quote.notes && (
                            <>
                                <h3 className="quote-section-heading" style={{ marginTop: "12px" }}>Additional Notes</h3>
                                <p className="quote-notes">{quote.notes}</p>
                            </>
                        )}
                        {quote.deliveryTimeline && (
                            <>
                                <h3 className="quote-section-heading" style={{ marginTop: "12px" }}>Delivery Timeline</h3>
                                <p className="quote-notes">{quote.deliveryTimeline}</p>
                            </>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="quote-totals">
                        <div className="quote-total-row">
                            <span>Sub Total</span>
                            <span>{subtotal.toLocaleString("en-KE")}</span>
                        </div>
                        {discount > 0 && (
                            <div className="quote-total-row quote-discount">
                                <span>Discount</span>
                                <span>– {discount.toLocaleString("en-KE")}</span>
                            </div>
                        )}
                        <div className="quote-total-divider" />
                        <div className="quote-total-final">
                            <span>Total</span>
                            <span>KES {finalPrice.toLocaleString("en-KE")}</span>
                        </div>
                        <div className="quote-total-divider" />
                    </div>
                </div>

                {/* FOOTER — always at A4 bottom */}
                <div className="quote-footer">
                    <div className="quote-footer-contact">
                        For any enquiries, email us on{" "}
                        <strong>info@woodenhouseskenya.com</strong>
                        {" "}or call us on{" "}
                        <strong>+254 716 111 187</strong>
                    </div>
                    <div className="quote-footer-sig">
                        <div className="quote-sig-line" />
                        <p>Authorized Signature</p>
                    </div>
                </div>
            </div>

            {/* ── A4 Print Styles ── */}
            <style>{`
                .quote-a4 {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 14mm 16mm 14mm 16mm;
                    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
                    font-size: 12px;
                    color: #1a1a1a;
                    box-sizing: border-box;
                    box-shadow: 0 2px 24px rgba(0,0,0,0.10);
                    flex-direction: column;
                }
                .quote-title {
                    text-align: center;
                    font-size: 26px;
                    font-weight: 700;
                    color: #8B5E3C;
                    margin: 0 0 14px 0;
                    letter-spacing: 1px;
                }
                .quote-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 14px;
                }
                .quote-logo-block {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .quote-logo-img {
                    width: 54px;
                    height: 54px;
                    object-fit: contain;
                    border-radius: 6px;
                }
                .quote-company-name { display: flex; flex-direction: column; }
                .quote-company-title {
                    font-size: 17px; font-weight: 800;
                    color: #8B5E3C; line-height: 1.2; letter-spacing: 0.5px;
                }
                .quote-company-sub {
                    font-size: 13px; font-weight: 600;
                    color: #8B5E3C; letter-spacing: 2px;
                }
                .quote-meta { text-align: right; }
                .quote-meta-row {
                    display: flex; gap: 10px;
                    justify-content: flex-end; margin-bottom: 3px;
                }
                .quote-meta-label { color: #6b7280; font-size: 11px; }
                .quote-meta-value {
                    font-weight: 700; font-size: 12px; color: #1a1a1a;
                    min-width: 110px; text-align: left;
                }
                .quote-parties {
                    display: grid; grid-template-columns: 1fr 1fr;
                    gap: 10px; margin-bottom: 10px;
                }
                .quote-party-box { border-radius: 6px; overflow: hidden; border: 1px solid #e8d5c4; }
                .quote-party-header {
                    background: #F5F0EB; color: #8B5E3C; font-weight: 700;
                    font-size: 12px; padding: 7px 12px; border-bottom: 1px solid #e8d5c4;
                }
                .quote-party-body {
                    background: #FFFAF7; padding: 9px 12px;
                    font-size: 11.5px; line-height: 1.65; color: #374151;
                }
                .quote-party-name { font-weight: 700; font-size: 13px; color: #111827; margin-bottom: 2px; }
                .quote-supply-row {
                    display: flex; justify-content: space-between;
                    color: #6b7280; font-size: 11px; margin-bottom: 10px; padding: 0 2px;
                }
                .quote-supply-row strong { color: #111827; }
                .quote-table {
                    width: 100%; border-collapse: collapse;
                    margin-bottom: 14px; font-size: 12px;
                }
                .quote-th {
                    background: #8B5E3C; color: white;
                    font-weight: 600; padding: 9px 10px;
                }
                .quote-th-desc { text-align: left; }
                .quote-th-num  { text-align: right; width: 80px; }
                .quote-row-white { background: #ffffff; }
                .quote-row-cream { background: #FEF8F3; }
                .quote-td-desc {
                    padding: 9px 10px; color: #111827; border-bottom: 1px solid #f3e8de;
                }
                .quote-td-num {
                    padding: 9px 10px; text-align: right;
                    color: #111827; border-bottom: 1px solid #f3e8de;
                }
                .quote-bottom {
                    flex: 1; display: grid; grid-template-columns: 1fr 220px;
                    gap: 16px; margin-bottom: 16px; align-content: start;
                }
                .quote-bottom-left { font-size: 11.5px; }
                .quote-section-heading {
                    color: #8B5E3C; font-size: 13px; font-weight: 700; margin: 0 0 6px 0;
                }
                .quote-terms-list {
                    padding-left: 16px; margin: 0;
                    color: #374151; line-height: 1.7;
                }
                .quote-notes { color: #374151; line-height: 1.7; margin: 0; }
                .quote-totals { font-size: 12px; }
                .quote-total-row {
                    display: flex; justify-content: space-between;
                    padding: 5px 0; color: #374151;
                }
                .quote-discount { color: #10B981; font-weight: 600; }
                .quote-total-divider { border-top: 1.5px solid #d1d5db; margin: 6px 0; }
                .quote-total-final {
                    display: flex; justify-content: space-between;
                    font-size: 16px; font-weight: 800; color: #111827; padding: 4px 0;
                }
                .quote-footer {
                    display: flex; justify-content: space-between; align-items: flex-end;
                    border-top: 1.5px solid #8B5E3C; padding-top: 10px;
                    margin-top: auto; font-size: 11.5px;
                }
                .quote-footer-contact { color: #374151; line-height: 1.6; }
                .quote-footer-sig { text-align: center; }
                .quote-sig-line {
                    width: 130px; border-top: 1.5px solid #374151;
                    margin: 36px auto 6px;
                }
                .quote-footer-sig p { color: #374151; font-size: 11px; margin: 0; }

                @media print {
                    @page { size: A4 portrait; margin: 0; }
                    body * { visibility: hidden; }
                    #quote-document, #quote-document * { visibility: visible; }
                    #quote-document {
                        position: fixed; top: 0; left: 0;
                        width: 210mm; height: 297mm;
                        padding: 14mm 16mm;
                        box-shadow: none !important; margin: 0 !important;
                        display: flex !important; flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
