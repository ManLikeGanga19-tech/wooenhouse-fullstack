'use client';

import { create } from 'zustand';
import type { MailboxAccount, MailboxFolder } from '@/lib/api/client';

interface MailboxState {
    accounts:        MailboxAccount[];
    selectedAccount: string | null;
    selectedFolder:  string | null;
    folders:         MailboxFolder[];
    selectedUid:     number | null;
    composeOpen:     boolean;
    replyTo:         { uid: number; messageId: string | null; references: string | null; subject: string; from: string } | null;

    setAccounts:        (accounts: MailboxAccount[]) => void;
    setSelectedAccount: (address: string) => void;
    setSelectedFolder:  (folder: string) => void;
    setFolders:         (folders: MailboxFolder[]) => void;
    setSelectedUid:     (uid: number | null) => void;
    openCompose:        () => void;
    openReply:          (payload: NonNullable<MailboxState['replyTo']>) => void;
    closeCompose:       () => void;
}

export const useMailboxStore = create<MailboxState>((set) => ({
    accounts:        [],
    selectedAccount: null,
    selectedFolder:  'INBOX',
    folders:         [],
    selectedUid:     null,
    composeOpen:     false,
    replyTo:         null,

    setAccounts:        (accounts) => set({ accounts }),
    setSelectedAccount: (address) => set({ selectedAccount: address, selectedFolder: 'INBOX', selectedUid: null, folders: [] }),
    setSelectedFolder:  (folder)  => set({ selectedFolder: folder, selectedUid: null }),
    setFolders:         (folders) => set({ folders }),
    setSelectedUid:     (uid)     => set({ selectedUid: uid }),
    openCompose:        ()        => set({ composeOpen: true, replyTo: null }),
    openReply:          (payload) => set({ composeOpen: true, replyTo: payload }),
    closeCompose:       ()        => set({ composeOpen: false, replyTo: null }),
}));
