'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Paperclip, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type MailboxEmailSummary } from '@/lib/api/client';
import { useMailboxStore } from '@/lib/store/mailboxStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, isToday, isYesterday } from 'date-fns';

const PAGE_SIZE = 25;

function formatDate(iso: string) {
    const d = new Date(iso);
    if (isToday(d))     return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'd MMM');
}

export default function EmailList() {
    const { selectedAccount, selectedFolder, selectedUid, setSelectedUid, folders } = useMailboxStore();

    const [emails,  setEmails]  = useState<MailboxEmailSummary[]>([]);
    const [total,   setTotal]   = useState(0);
    const [page,    setPage]    = useState(1);
    const [search,  setSearch]  = useState('');
    const [query,   setQuery]   = useState('');
    const [loading, setLoading] = useState(false);

    // Only start loading emails once folders are loaded — this serialises the two
    // IMAP requests so they don't both compete for the same connection lock.
    const foldersReady = folders.length > 0;

    const load = useCallback(async (p: number, q: string) => {
        if (!selectedAccount || !selectedFolder) return;
        setLoading(true);
        try {
            const res = await api.admin.mailbox.getEmails(selectedAccount, selectedFolder, {
                page: p, pageSize: PAGE_SIZE, search: q || undefined,
            });
            setEmails(res.data.emails);
            setTotal(res.data.total);
        } catch {
            toast.error('Failed to load emails');
        } finally {
            setLoading(false);
        }
    }, [selectedAccount, selectedFolder]);

    useEffect(() => {
        setPage(1);
        setSearch('');
        setQuery('');
        setEmails([]);
    }, [selectedAccount, selectedFolder]);

    // Wait until folder list is loaded before firing the email list request
    useEffect(() => {
        if (!foldersReady) return;
        load(page, query);
    }, [load, page, query, foldersReady]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        setQuery(search);
    };

    if (!selectedAccount || !selectedFolder) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-sm">Select an account and folder</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-r border-gray-200 bg-white w-80 shrink-0">
            {/* Search bar */}
            <div className="p-3 border-b border-gray-200 space-y-2">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search subject / from..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                        onClick={() => load(page, query)}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </Button>
                </form>
                <p className="text-xs text-gray-400">{total} messages</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {loading && emails.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                    </div>
                ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <p className="text-sm">No emails found</p>
                    </div>
                ) : (
                    emails.map(email => (
                        <EmailRow
                            key={email.uid}
                            email={email}
                            active={selectedUid === email.uid}
                            onSelect={() => setSelectedUid(email.uid)}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
                <div className="border-t border-gray-200 p-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)}</span>
                    <div className="flex gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
                        >
                            ←
                        </button>
                        <button
                            disabled={page * PAGE_SIZE >= total}
                            onClick={() => setPage(p => p + 1)}
                            className="px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-40"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function EmailRow({ email, active, onSelect }: {
    email: MailboxEmailSummary;
    active: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={cn(
                'w-full text-left px-3 py-3 transition-colors',
                active ? 'bg-amber-50' : 'hover:bg-gray-50',
                !email.isRead && !active ? 'bg-blue-50/40' : ''
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className={cn('text-sm truncate flex-1', !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700')}>
                    {email.fromName || email.from}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{formatDate(email.date)}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
                {!email.isRead && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                )}
                <p className={cn('text-xs truncate flex-1', !email.isRead ? 'font-medium text-gray-800' : 'text-gray-600')}>
                    {email.subject}
                </p>
                {email.hasAttachments && <Paperclip size={11} className="text-gray-400 shrink-0" />}
            </div>
            {email.preview && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{email.preview}</p>
            )}
        </button>
    );
}
