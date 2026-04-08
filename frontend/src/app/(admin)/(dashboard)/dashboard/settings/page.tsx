"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { Lock, User, Globe } from "lucide-react";

export default function SettingsPage() {
    const user = useAuthStore(s => s.user);

    const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [savingPw, setSavingPw] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (pwForm.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        setSavingPw(true);
        try {
            await api.auth.changePassword({
                currentPassword: pwForm.currentPassword,
                newPassword:     pwForm.newPassword,
            });
            toast.success("Password updated successfully");
            setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update password");
        } finally {
            setSavingPw(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold" style={{ color: "#8B5E3C" }}>Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and preferences</p>
            </div>

            {/* Profile */}
            <Card className="border-2 border-gray-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <User size={20} style={{ color: "#8B5E3C" }} />
                        <CardTitle style={{ color: "#8B5E3C" }}>Profile</CardTitle>
                    </div>
                    <CardDescription>Your admin account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={user?.name ?? ""} readOnly className="border-2 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email ?? ""} readOnly className="border-2 bg-gray-50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Input value={user?.role ?? "admin"} readOnly className="border-2 bg-gray-50 capitalize" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-2 border-gray-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Lock size={20} style={{ color: "#8B5E3C" }} />
                        <CardTitle style={{ color: "#8B5E3C" }}>Change Password</CardTitle>
                    </div>
                    <CardDescription>Update your admin password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                                type="password"
                                value={pwForm.currentPassword}
                                onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                                className="border-2"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={pwForm.newPassword}
                                onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                                className="border-2"
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input
                                type="password"
                                value={pwForm.confirmPassword}
                                onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                className="border-2"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={savingPw} style={{ backgroundColor: "#8B5E3C" }} className="text-white">
                            {savingPw ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Business Info */}
            <Card className="border-2 border-gray-200">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe size={20} style={{ color: "#8B5E3C" }} />
                        <CardTitle style={{ color: "#8B5E3C" }}>Business Information</CardTitle>
                    </div>
                    <CardDescription>Contact details shown on quotes and emails</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { label: "Business Name",  value: "Wooden Houses Kenya" },
                            { label: "Location",       value: "Naivasha, Kenya" },
                            { label: "Phone",          value: "+254 716 111 187" },
                            { label: "Email",          value: "info@woodenhouseskenya.com" },
                            { label: "Website",        value: "woodenhouseskenya.com" },
                        ].map(f => (
                            <div key={f.label} className="space-y-2">
                                <Label>{f.label}</Label>
                                <Input value={f.value} readOnly className="border-2 bg-gray-50" />
                            </div>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        To update business details, contact your developer or update <code className="bg-gray-100 px-1 rounded">appsettings.json</code>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
