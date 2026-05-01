/**
 * Unit tests for src/lib/store/mailboxStore.ts
 *
 * Each test resets the store to its initial state so tests are independent.
 */

import { act } from "react";
import { useMailboxStore } from "@/lib/store/mailboxStore";

const ACCOUNTS = [
  { name: "Technical", address: "technical@woodenhouseskenya.com" },
  { name: "Info",      address: "info@woodenhouseskenya.com"      },
];

const FOLDERS = [
  { name: "INBOX",  displayName: "Inbox",  icon: "inbox",  totalCount: 10, unreadCount: 3 },
  { name: "Drafts", displayName: "Drafts", icon: "pencil", totalCount: 2,  unreadCount: 0 },
];

function reset() {
  useMailboxStore.setState({
    accounts:        [],
    selectedAccount: null,
    selectedFolder:  "INBOX",
    folders:         [],
    selectedUid:     null,
    composeOpen:     false,
    replyTo:         null,
  });
}

beforeEach(reset);

// ─── Accounts ─────────────────────────────────────────────────────────────────

describe("setAccounts", () => {
  it("stores the accounts list", () => {
    act(() => useMailboxStore.getState().setAccounts(ACCOUNTS));

    const { accounts } = useMailboxStore.getState();
    expect(accounts).toHaveLength(2);
    expect(accounts[0].address).toBe("technical@woodenhouseskenya.com");
  });
});

// ─── Selected account ─────────────────────────────────────────────────────────

describe("setSelectedAccount", () => {
  it("updates selectedAccount", () => {
    act(() => useMailboxStore.getState().setSelectedAccount("info@woodenhouseskenya.com"));

    expect(useMailboxStore.getState().selectedAccount).toBe("info@woodenhouseskenya.com");
  });

  it("resets folder to INBOX when account changes", () => {
    act(() => {
      useMailboxStore.getState().setSelectedFolder("Sent");
      useMailboxStore.getState().setSelectedAccount("info@woodenhouseskenya.com");
    });

    expect(useMailboxStore.getState().selectedFolder).toBe("INBOX");
  });

  it("clears selectedUid and folders when account changes", () => {
    act(() => {
      useMailboxStore.getState().setFolders(FOLDERS);
      useMailboxStore.getState().setSelectedUid(42);
      useMailboxStore.getState().setSelectedAccount("info@woodenhouseskenya.com");
    });

    const state = useMailboxStore.getState();
    expect(state.selectedUid).toBeNull();
    expect(state.folders).toHaveLength(0);
  });
});

// ─── Selected folder ──────────────────────────────────────────────────────────

describe("setSelectedFolder", () => {
  it("updates selectedFolder", () => {
    act(() => useMailboxStore.getState().setSelectedFolder("Drafts"));

    expect(useMailboxStore.getState().selectedFolder).toBe("Drafts");
  });

  it("clears selectedUid when folder changes", () => {
    act(() => {
      useMailboxStore.getState().setSelectedUid(101);
      useMailboxStore.getState().setSelectedFolder("Sent");
    });

    expect(useMailboxStore.getState().selectedUid).toBeNull();
  });
});

// ─── Folders ──────────────────────────────────────────────────────────────────

describe("setFolders", () => {
  it("stores folders list", () => {
    act(() => useMailboxStore.getState().setFolders(FOLDERS));

    const { folders } = useMailboxStore.getState();
    expect(folders).toHaveLength(2);
    expect(folders[0].unreadCount).toBe(3);
  });
});

// ─── Selected UID ─────────────────────────────────────────────────────────────

describe("setSelectedUid", () => {
  it("sets a numeric uid", () => {
    act(() => useMailboxStore.getState().setSelectedUid(101));
    expect(useMailboxStore.getState().selectedUid).toBe(101);
  });

  it("clears uid when set to null", () => {
    act(() => {
      useMailboxStore.getState().setSelectedUid(101);
      useMailboxStore.getState().setSelectedUid(null);
    });
    expect(useMailboxStore.getState().selectedUid).toBeNull();
  });
});

// ─── Compose ──────────────────────────────────────────────────────────────────

describe("compose modal", () => {
  it("openCompose sets composeOpen to true and clears replyTo", () => {
    act(() => useMailboxStore.getState().openCompose());

    const state = useMailboxStore.getState();
    expect(state.composeOpen).toBe(true);
    expect(state.replyTo).toBeNull();
  });

  it("openReply sets composeOpen and stores replyTo payload", () => {
    const payload = {
      uid: 101, messageId: "<x@mail>", references: null,
      subject: "Re: Project inquiry", from: "client@example.com",
    };

    act(() => useMailboxStore.getState().openReply(payload));

    const state = useMailboxStore.getState();
    expect(state.composeOpen).toBe(true);
    expect(state.replyTo).toEqual(payload);
    expect(state.replyTo?.subject).toBe("Re: Project inquiry");
  });

  it("closeCompose resets composeOpen and replyTo", () => {
    act(() => {
      useMailboxStore.getState().openReply({
        uid: 101, messageId: "<x@mail>", references: null,
        subject: "Re: Test", from: "test@example.com",
      });
      useMailboxStore.getState().closeCompose();
    });

    const state = useMailboxStore.getState();
    expect(state.composeOpen).toBe(false);
    expect(state.replyTo).toBeNull();
  });

  it("openCompose clears any existing replyTo", () => {
    act(() => {
      useMailboxStore.getState().openReply({
        uid: 5, messageId: null, references: null,
        subject: "Re: Old thread", from: "old@example.com",
      });
      useMailboxStore.getState().openCompose();
    });

    expect(useMailboxStore.getState().replyTo).toBeNull();
  });
});
