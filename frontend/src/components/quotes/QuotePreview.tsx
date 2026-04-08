// src/components/quotes/QuotePreview.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Quote } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils/formatters";
import { HOUSE_TYPE_LABELS } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Home, Calendar, MapPin } from "lucide-react";

interface QuotePreviewProps {
    quote: Partial<Quote>;
    quoteNumber?: string;
}

export default function QuotePreview({ quote, quoteNumber }: QuotePreviewProps) {
    const additionalTotal = quote.additionalCosts?.reduce((sum, cost) => sum + cost.cost, 0) || 0;
    const subtotal = (quote.basePrice || 0) + additionalTotal;
    const finalPrice = subtotal - (quote.discount || 0);

    return (
        <Card className="border-2 border-gray-200 bg-white">
            <CardHeader className="bg-linear-to-r from-[#8B5E3C] to-[#5D3A1A] text-white">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            {quoteNumber || "Quote Preview"}
                        </CardTitle>
                        <p className="text-white/80 text-sm mt-1">
                            Wooden Houses Kenya
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Calendar size={14} />
                            <span>{formatDate(new Date())}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
                {/* Customer Info */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-gray-900 font-medium">{quote.customerName || "—"}</p>
                        <p className="text-gray-600">{quote.customerEmail || "—"}</p>
                        {quote.customerPhone && (
                            <p className="text-gray-600">{quote.customerPhone}</p>
                        )}
                        {quote.location && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} />
                                <span>{quote.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                {/* House Details */}
                {quote.houseType && (
                    <>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">House Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Home size={14} style={{ color: "#8B5E3C" }} />
                                    <span className="text-gray-900 font-medium">
                                        {HOUSE_TYPE_LABELS[quote.houseType as keyof typeof HOUSE_TYPE_LABELS]}
                                    </span>
                                </div>
                                {quote.houseSize && (
                                    <p className="text-gray-600">Size: {quote.houseSize}</p>
                                )}
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

                {/* Pricing */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Pricing Breakdown</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Price:</span>
                            <span className="font-medium">{formatCurrency(quote.basePrice || 0)}</span>
                        </div>

                        {quote.additionalCosts && quote.additionalCosts.length > 0 && (
                            <>
                                {quote.additionalCosts.map((cost) => (
                                    <div key={cost.id} className="flex justify-between text-sm pl-4">
                                        <span className="text-gray-600">+ {cost.item}</span>
                                        <span className="text-gray-700">{formatCurrency(cost.cost)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="text-gray-600">Additional Costs Total:</span>
                                    <span className="font-medium">{formatCurrency(additionalTotal)}</span>
                                </div>
                            </>
                        )}

                        <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="text-gray-900 font-medium">Subtotal:</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>

                        {quote.discount && quote.discount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Discount:</span>
                                <span className="font-medium">-{formatCurrency(quote.discount)}</span>
                            </div>
                        )}

                        <Separator className="my-3" />

                        <div className="flex justify-between text-lg py-2 bg-[#F5F0EB] rounded-lg px-3">
                            <span className="font-bold" style={{ color: "#8B5E3C" }}>
                                Final Price:
                            </span>
                            <span className="font-bold" style={{ color: "#8B5E3C" }}>
                                {formatCurrency(finalPrice)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Terms */}
                {(quote.paymentTerms || quote.deliveryTimeline || quote.validityPeriod) && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
                            <div className="space-y-2 text-sm">
                                {quote.paymentTerms && (
                                    <div>
                                        <p className="text-gray-600 font-medium">Payment Terms:</p>
                                        <p className="text-gray-700">{quote.paymentTerms}</p>
                                    </div>
                                )}
                                {quote.deliveryTimeline && (
                                    <div>
                                        <p className="text-gray-600 font-medium">Delivery Timeline:</p>
                                        <p className="text-gray-700">{quote.deliveryTimeline}</p>
                                    </div>
                                )}
                                {quote.validityPeriod && (
                                    <div>
                                        <p className="text-gray-600 font-medium">Quote Validity:</p>
                                        <p className="text-gray-700">{quote.validityPeriod}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Notes */}
                {quote.notes && (
                    <>
                        <Separator />
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">Additional Notes</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                        </div>
                    </>
                )}

                {/* Footer */}
                <Separator />
                <div className="text-center text-xs text-gray-500">
                    <p>Wooden Houses Kenya</p>
                    <p className="mt-1">Phone: +254 789 104 438 | Email: info@woodenhouseskenya.com</p>
                    <p className="mt-1">Naivasha, Kenya</p>
                </div>
            </CardContent>
        </Card>
    );
}