'use client';

import { useState, useEffect } from 'react';
import { X, Send, FileText, Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { useMailboxStore } from '@/lib/store/mailboxStore';
import { toast } from 'sonner';

export default function ComposeModal() {
    const { composeOpen, replyTo, closeCompose, selectedAccount, accounts } = useMailboxStore();

    const [from,    setFrom]    = useState(selectedAccount ?? accounts[0]?.address ?? '');
    const [to,      setTo]      = useState('');
    const [subject, setSubject] = useState('');
    const [body,    setBody]    = useState('');
    const [sending, setSending] = useState(false);
    const [saving,  setSaving]  = useState(false);

    useEffect(() => {
        if (composeOpen) {
            setFrom(selectedAccount ?? accounts[0]?.address ?? '');
            if (replyTo) {
                setTo(replyTo.from);
                setSubject(replyTo.subject);
                setBody('');
            } else {
                setTo('');
                setSubject('');
                setBody('');
            }
        }
    }, [composeOpen, replyTo, selectedAccount, accounts]);

    const handleSend = async () => {
        if (!to.trim() || !subject.trim()) {
            toast.error('To and Subject are required');
            return;
        }
        setSending(true);
        try {
            await api.admin.mailbox.sendEmail({
                accountAddress: from,
                to,
                subject,
                htmlBody:  body ? `<pre style="font-family:sans-serif;white-space:pre-wrap">${body}</pre>` : undefined,
                textBody:  body || undefined,
                inReplyTo: replyTo?.messageId ?? undefined,
                references: replyTo
                    ? [replyTo.references, replyTo.messageId].filter(Boolean).join(' ')
                    : undefined,
            });
            toast.success('Email sent');
            closeCompose();
        } catch {
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            await api.admin.mailbox.saveDraft({
                accountAddress: from,
                to:      to   || '(draft)',
                subject: subject || '(no subject)',
                textBody: body || undefined,
            });
            toast.success('Draft saved');
            closeCompose();
        } catch {
            toast.error('Failed to save draft');
        } finally {
            setSaving(false);
        }
    };

    if (!composeOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col" style={{ maxHeight: '85vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">{replyTo ? 'Reply' : 'New Email'}</h3>
                    <button onClick={closeCompose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {/* From */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-14 shrink-0">From</span>
                        <select
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                            {accounts.map(a => (
                                <option key={a.address} value={a.address}>
                                    {a.name} &lt;{a.address}&gt;
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-14 shrink-0">To</span>
                        <Input
                            placeholder="recipient@example.com"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="flex-1 h-8 text-sm"
                        />
                    </div>

                    {/* Subject */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-14 shrink-0">Subject</span>
                        <Input
                            placeholder="Subject"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="flex-1 h-8 text-sm"
                        />
                    </div>

                    {/* Body */}
                    <Textarea
                        placeholder="Write your message..."
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="min-h-[200px] text-sm resize-none"
                    />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-200 flex items-center gap-2">
                    <Button
                        onClick={handleSend}
                        disabled={sending || saving}
                        className="gap-1.5 text-white"
                        style={{ backgroundColor: '#8B5E3C' }}
                    >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Send
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={sending || saving}
                        className="gap-1.5"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                        Save Draft
                    </Button>
                    <Button variant="ghost" onClick={closeCompose} className="ml-auto text-gray-500">
                        Discard
                    </Button>
                </div>
            </div>
        </div>
    );
}
