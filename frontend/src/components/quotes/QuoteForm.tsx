// src/components/quotes/QuoteForm.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Quote } from "@/types";
import { HOUSE_TYPE_LABELS } from "@/types";

interface QuoteFormProps {
    formData: Partial<Quote>;
    onFormChange: (field: keyof Quote, value: any) => void;
}

export default function QuoteForm({ formData, onFormChange }: QuoteFormProps) {
    return (
        <div className="space-y-6">
            {/* Customer Information */}
            <Card className="border-2 border-gray-200">
                <CardHeader>
                    <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>
                        Customer Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="customerName" className="text-sm font-medium mb-2 block">
                                Customer Name *
                            </Label>
                            <Input
                                id="customerName"
                                value={formData.customerName || ""}
                                onChange={(e) => onFormChange("customerName", e.target.value)}
                                placeholder="John Kamau"
                                className="border-2 focus:border-[#8B5E3C]"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="customerEmail" className="text-sm font-medium mb-2 block">
                                Email Address *
                            </Label>
                            <Input
                                id="customerEmail"
                                type="email"
                                value={formData.customerEmail || ""}
                                onChange={(e) => onFormChange("customerEmail", e.target.value)}
                                placeholder="john@example.com"
                                className="border-2 focus:border-[#8B5E3C]"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="customerPhone" className="text-sm font-medium mb-2 block">
                                Phone Number
                            </Label>
                            <Input
                                id="customerPhone"
                                type="tel"
                                value={formData.customerPhone || ""}
                                onChange={(e) => onFormChange("customerPhone", e.target.value)}
                                placeholder="+254 712 345 678"
                                className="border-2 focus:border-[#8B5E3C]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="location" className="text-sm font-medium mb-2 block">
                                Project Location *
                            </Label>
                            <Input
                                id="location"
                                value={formData.location || ""}
                                onChange={(e) => onFormChange("location", e.target.value)}
                                placeholder="Nairobi"
                                className="border-2 focus:border-[#8B5E3C]"
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* House Details */}
            <Card className="border-2 border-gray-200">
                <CardHeader>
                    <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>
                        House Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="houseType" className="text-sm font-medium mb-2 block">
                                House Type *
                            </Label>
                            <Select
                                value={formData.houseType}
                                onValueChange={(value: Quote['houseType']) => onFormChange("houseType", value)}
                                required
                            >
                                <SelectTrigger className="border-2 focus:border-[#8B5E3C]">
                                    <SelectValue placeholder="Select house type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(HOUSE_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="houseSize" className="text-sm font-medium mb-2 block">
                                House Size (Optional)
                            </Label>
                            <Input
                                id="houseSize"
                                value={formData.houseSize || ""}
                                onChange={(e) => onFormChange("houseSize", e.target.value)}
                                placeholder="e.g., 6m x 8m"
                                className="border-2 focus:border-[#8B5E3C]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card className="border-2 border-gray-200">
                <CardHeader>
                    <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>
                        Terms & Conditions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="paymentTerms" className="text-sm font-medium mb-2 block">
                            Payment Terms
                        </Label>
                        <Textarea
                            id="paymentTerms"
                            value={formData.paymentTerms || ""}
                            onChange={(e) => onFormChange("paymentTerms", e.target.value)}
                            placeholder="e.g., 50% deposit, 50% on completion"
                            rows={3}
                            className="border-2 focus:border-[#8B5E3C] resize-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="deliveryTimeline" className="text-sm font-medium mb-2 block">
                                Delivery Timeline
                            </Label>
                            <Input
                                id="deliveryTimeline"
                                value={formData.deliveryTimeline || ""}
                                onChange={(e) => onFormChange("deliveryTimeline", e.target.value)}
                                placeholder="e.g., 2-3 weeks"
                                className="border-2 focus:border-[#8B5E3C]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="validityPeriod" className="text-sm font-medium mb-2 block">
                                Validity Period *
                            </Label>
                            <Input
                                id="validityPeriod"
                                value={formData.validityPeriod || ""}
                                onChange={(e) => onFormChange("validityPeriod", e.target.value)}
                                placeholder="e.g., 30 days"
                                className="border-2 focus:border-[#8B5E3C]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
                            Additional Notes
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ""}
                            onChange={(e) => onFormChange("notes", e.target.value)}
                            placeholder="Any additional information or special requirements..."
                            rows={4}
                            className="border-2 focus:border-[#8B5E3C] resize-none"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}