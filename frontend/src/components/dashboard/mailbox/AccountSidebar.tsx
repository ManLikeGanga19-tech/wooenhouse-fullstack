'use client';

import { useEffect } from 'react';
import { Inbox, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, type MailboxFolder } from '@/lib/api/client';
import { useMailboxStore } from '@/lib/store/mailboxStore';
import { toast } from 'sonner';

const ICON_MAP: Record<string, string> = {
    inbox:          '📥',
    send:           '📤',
    pencil:         '✏️',
    trash:          '🗑️',
    'alert-triangle':'⚠️',
    archive:        '📦',
    folder:         '📁',
};

interface Props {
    loading: boolean;
}

export default function AccountSidebar({ loading }: Props) {
    const {
        accounts, selectedAccount, selectedFolder,
        folders, setSelectedAccount, setSelectedFolder, setFolders,
    } = useMailboxStore();

    useEffect(() => {
        if (!selectedAccount) return;
        let cancelled = false;

        api.admin.mailbox.getFolders(selectedAccount)
            .then(res => { if (!cancelled) setFolders(res.data); })
            .catch((err: unknown) => {
                const msg = err instanceof Error ? err.message : 'Failed to load folders';
                toast.error('Failed to load folders', { description: msg });
            });

        return () => { cancelled = true; };
    }, [selectedAccount, setFolders]);

    return (
        <aside className="flex flex-col h-full border-r border-gray-200 bg-white w-56 shrink-0">
            {/* Account list */}
            <div className="border-b border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Accounts</p>
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={16} className="animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {accounts.map(acc => (
                            <button
                                key={acc.address}
                                onClick={() => setSelectedAccount(acc.address)}
                                className={cn(
                                    'w-full text-left px-2 py-2 rounded-lg text-sm transition-colors',
                                    selectedAccount === acc.address
                                        ? 'text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                                style={selectedAccount === acc.address ? { backgroundColor: '#8B5E3C' } : {}}
                            >
                                <p className="font-medium truncate">{acc.name}</p>
                                <p className={cn('text-xs truncate', selectedAccount === acc.address ? 'text-amber-100' : 'text-gray-400')}>
                                    {acc.address.split('@')[0]}
                                </p>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Folder list */}
            <div className="flex-1 overflow-y-auto p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Folders</p>
                {!selectedAccount ? (
                    <p className="text-xs text-gray-400 px-1">Select an account</p>
                ) : folders.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={14} className="animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {folders.map(f => (
                            <FolderRow
                                key={f.name}
                                folder={f}
                                active={selectedFolder === f.name}
                                onSelect={() => setSelectedFolder(f.name)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </aside>
    );
}

function FolderRow({ folder, active, onSelect }: { folder: MailboxFolder; active: boolean; onSelect: () => void }) {
    const emoji = ICON_MAP[folder.icon] ?? '📁';
    return (
        <button
            onClick={onSelect}
            className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors',
                active ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
            )}
            style={active ? { backgroundColor: '#8B5E3C' } : {}}
        >
            <span className="flex items-center gap-2 min-w-0">
                <span className="text-base leading-none">{emoji}</span>
                <span className="truncate">{folder.displayName}</span>
            </span>
            {folder.unreadCount > 0 && (
                <span
                    className="ml-1 shrink-0 text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={active
                        ? { background: 'rgba(255,255,255,0.25)', color: 'white' }
                        : { background: '#8B5E3C', color: 'white' }}
                >
                    {folder.unreadCount > 99 ? '99+' : folder.unreadCount}
                </span>
            )}
        </button>
    );
}
