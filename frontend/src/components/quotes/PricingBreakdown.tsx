// src/components/quotes/PricingBreakdown.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdditionalCost } from "@/types";
import { formatCurrency } from "@/lib/utils/formatters";
import { Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PricingBreakdownProps {
    basePrice: number;
    additionalCosts: AdditionalCost[];
    discount: number;
    onBasePriceChange: (value: number) => void;
    onAdditionalCostsChange: (costs: AdditionalCost[]) => void;
    onDiscountChange: (value: number) => void;
}

export default function PricingBreakdown({
    basePrice,
    additionalCosts,
    discount,
    onBasePriceChange,
    onAdditionalCostsChange,
    onDiscountChange,
}: PricingBreakdownProps) {
    const handleAddCost = () => {
        const newCost: AdditionalCost = {
            id: Date.now().toString(),
            item: "",
            description: "",
            cost: 0,
        };
        onAdditionalCostsChange([...additionalCosts, newCost]);
    };

    const handleRemoveCost = (id: string) => {
        onAdditionalCostsChange(additionalCosts.filter((c) => c.id !== id));
    };

    const handleUpdateCost = (id: string, field: keyof AdditionalCost, value: string | number) => {
        onAdditionalCostsChange(
            additionalCosts.map((c) =>
                c.id === id ? { ...c, [field]: value } : c
            )
        );
    };

    // Calculate totals
    const additionalTotal = additionalCosts.reduce((sum, cost) => sum + cost.cost, 0);
    const subtotal = basePrice + additionalTotal;
    const finalPrice = subtotal - discount;

    return (
        <Card className="border-2 border-gray-200">
            <CardHeader>
                <CardTitle className="text-xl" style={{ color: "#8B5E3C" }}>
                    Pricing Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Base Price */}
                <div>
                    <Label htmlFor="basePrice" className="text-sm font-medium mb-2 block">
                        Base Price (KES) *
                    </Label>
                    <Input
                        id="basePrice"
                        type="number"
                        value={basePrice || ""}
                        onChange={(e) => onBasePriceChange(Number(e.target.value))}
                        placeholder="500000"
                        className="border-2 focus:border-[#8B5E3C]"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Base price for the house type selected
                    </p>
                </div>

                <Separator />

                {/* Additional Costs */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">Additional Costs</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddCost}
                            className="border-2 hover:border-[#8B5E3C]"
                        >
                            <Plus size={14} className="mr-1" />
                            Add Item
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {additionalCosts.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                No additional costs. Click "Add Item" to add one.
                            </p>
                        ) : (
                            additionalCosts.map((cost) => (
                                <div
                                    key={cost.id}
                                    className="rounded-lg border-2 border-gray-200 p-3 space-y-2"
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label className="text-xs">Item Name *</Label>
                                            <Input
                                                value={cost.item}
                                                onChange={(e) =>
                                                    handleUpdateCost(cost.id, "item", e.target.value)
                                                }
                                                placeholder="e.g., Electrical Wiring"
                                                className="border-2 mt-1"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Cost (KES) *</Label>
                                            <Input
                                                type="number"
                                                value={cost.cost || ""}
                                                onChange={(e) =>
                                                    handleUpdateCost(cost.id, "cost", Number(e.target.value))
                                                }
                                                placeholder="50000"
                                                className="border-2 mt-1"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Label className="text-xs">Description (Optional)</Label>
                                            <Input
                                                value={cost.description || ""}
                                                onChange={(e) =>
                                                    handleUpdateCost(cost.id, "description", e.target.value)
                                                }
                                                placeholder="Brief description"
                                                className="border-2 mt-1"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleRemoveCost(cost.id)}
                                            className="border-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <Separator />

                {/* Discount */}
                <div>
                    <Label htmlFor="discount" className="text-sm font-medium mb-2 block">
                        Discount (KES)
                    </Label>
                    <Input
                        id="discount"
                        type="number"
                        value={discount || ""}
                        onChange={(e) => onDiscountChange(Number(e.target.value))}
                        placeholder="0"
                        className="border-2 focus:border-[#8B5E3C]"
                    />
                </div>

                <Separator />

                {/* Summary */}
                <div className="space-y-2 bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">{formatCurrency(basePrice)}</span>
                    </div>
                    {additionalCosts.length > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Additional Costs:</span>
                            <span className="font-medium">{formatCurrency(additionalTotal)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                            <span>Discount:</span>
                            <span className="font-medium">-{formatCurrency(discount)}</span>
                        </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-lg font-bold">
                        <span style={{ color: "#8B5E3C" }}>Final Price:</span>
                        <span style={{ color: "#8B5E3C" }}>{formatCurrency(finalPrice)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}