'use client';

import { useEffect, useState } from 'react';
import {
    Reply, Trash2, MoveRight, Loader2, Paperclip,
    MailOpen, X, Download,
} from 'lucide-react';
import { api, type MailboxEmailDetail } from '@/lib/api/client';
import { useMailboxStore } from '@/lib/store/mailboxStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EmailReader() {
    const {
        selectedAccount, selectedFolder, selectedUid, setSelectedUid,
        folders, openReply,
    } = useMailboxStore();

    const [email,   setEmail]   = useState<MailboxEmailDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedAccount || !selectedFolder || !selectedUid) {
            setEmail(null);
            return;
        }
        let cancelled = false;
        setLoading(true);

        api.admin.mailbox.getEmail(selectedAccount, selectedFolder, selectedUid)
            .then(res => { if (!cancelled) setEmail(res.data); })
            .catch(() => toast.error('Failed to load email'))
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [selectedAccount, selectedFolder, selectedUid]);

    const handleDelete = async () => {
        if (!selectedAccount || !selectedFolder || !selectedUid) return;
        try {
            await api.admin.mailbox.deleteEmail(selectedAccount, selectedFolder, selectedUid);
            toast.success('Email deleted');
            setSelectedUid(null);
            setEmail(null);
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleReply = () => {
        if (!email) return;
        openReply({
            uid:        email.uid,
            messageId:  email.messageId,
            references: email.references,
            subject:    email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
            from:       email.from,
        });
    };

    if (!selectedUid) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 flex-1">
                <MailOpen size={48} className="mb-3" />
                <p className="text-sm">Select an email to read</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full flex-1">
                <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
        );
    }

    if (!email) return null;

    const trashFolder = folders.find(f =>
        f.displayName.toLowerCase() === 'trash' ||
        f.name.toLowerCase().includes('trash') ||
        f.name.toLowerCase().includes('deleted')
    );

    return (
        <div className="flex flex-col h-full flex-1 overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleReply}>
                    <Reply size={14} /> Reply
                </Button>
                {trashFolder && selectedFolder !== trashFolder.name && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-red-500 hover:text-red-600"
                        onClick={handleDelete}>
                        <Trash2 size={14} /> Delete
                    </Button>
                )}
                {selectedFolder === trashFolder?.name && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-red-500 hover:text-red-600"
                        onClick={handleDelete}>
                        <Trash2 size={14} /> Delete Permanently
                    </Button>
                )}
                <div className="ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedUid(null)}>
                        <X size={14} />
                    </Button>
                </div>
            </div>

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{email.subject}</h2>
                <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex gap-2">
                        <span className="text-gray-400 w-8 shrink-0">From</span>
                        <span className="font-medium text-gray-800">
                            {email.fromName ? `${email.fromName} <${email.from}>` : email.from}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-gray-400 w-8 shrink-0">To</span>
                        <span>{email.to}</span>
                    </div>
                    {email.cc && (
                        <div className="flex gap-2">
                            <span className="text-gray-400 w-8 shrink-0">Cc</span>
                            <span>{email.cc}</span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <span className="text-gray-400 w-8 shrink-0">Date</span>
                        <span>{format(new Date(email.date), 'PPpp')}</span>
                    </div>
                </div>
            </div>

            {/* Attachments */}
            {email.attachments.length > 0 && (
                <div className="px-6 py-2 border-b border-gray-100 flex flex-wrap gap-2 shrink-0">
                    {email.attachments.map(att => (
                        <a
                            key={att.contentId || att.fileName}
                            href={api.admin.mailbox.getAttachmentUrl(
                                selectedAccount!, selectedFolder!, email.uid,
                                att.contentId || att.fileName
                            )}
                            download={att.fileName}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Paperclip size={12} />
                            <span className="max-w-[140px] truncate">{att.fileName}</span>
                            <Download size={11} className="text-gray-400" />
                        </a>
                    ))}
                </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
                {email.htmlBody ? (
                    <iframe
                        srcDoc={email.htmlBody}
                        sandbox="allow-same-origin"
                        className="w-full h-full border-none"
                        title="Email body"
                    />
                ) : (
                    <pre className="px-6 py-4 text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {email.textBody ?? '(no content)'}
                    </pre>
                )}
            </div>
        </div>
    );
}
