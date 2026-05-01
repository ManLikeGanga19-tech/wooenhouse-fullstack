"use client"

import { useEffect, useState } from "react"
import { PenSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { useMailboxStore } from "@/lib/store/mailboxStore"
import AccountSidebar from "@/components/dashboard/mailbox/AccountSidebar"
import EmailList from "@/components/dashboard/mailbox/EmailList"
import EmailReader from "@/components/dashboard/mailbox/EmailReader"
import ComposeModal from "@/components/dashboard/mailbox/ComposeModal"
import { toast } from "sonner"

export default function MailboxPage() {
    const { setAccounts, setSelectedAccount, openCompose } = useMailboxStore()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.admin.mailbox.getAccounts()
            .then(res => {
                setAccounts(res.data)
                if (res.data.length > 0) setSelectedAccount(res.data[0].address)
            })
            .catch(() => toast.error("Failed to load mailbox accounts"))
            .finally(() => setLoading(false))
    }, [setAccounts, setSelectedAccount])

    return (
        <div className="flex flex-col h-full -m-6">
            {/* Top bar */}
            <div
                className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0"
                style={{ background: "white" }}
            >
                <h1 className="text-xl font-bold" style={{ color: "#8B5E3C" }}>Mailbox</h1>
                {loading
                    ? <Loader2 size={16} className="animate-spin text-gray-400" />
                    : (
                        <Button
                            size="sm"
                            className="gap-1.5 text-white text-sm"
                            style={{ backgroundColor: "#8B5E3C" }}
                            onClick={openCompose}
                        >
                            <PenSquare size={14} /> Compose
                        </Button>
                    )
                }
            </div>

            {/* 3-pane layout */}
            <div className="flex flex-1 overflow-hidden">
                <AccountSidebar loading={loading} />
                <EmailList />
                <EmailReader />
            </div>

            <ComposeModal />
        </div>
    )
}
