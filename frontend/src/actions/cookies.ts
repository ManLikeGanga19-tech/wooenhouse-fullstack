"use server";

import { cookies } from "next/headers";

export type CookieConsent = {
    necessary: true;       // always on
    analytics: boolean;
    marketing: boolean;
};

const COOKIE_NAME = "cookie_consent";
const ONE_YEAR    = 60 * 60 * 24 * 365;

/** Accept all cookie categories */
export async function acceptAllCookies() {
    const store = await cookies();
    store.set(COOKIE_NAME, JSON.stringify({ necessary: true, analytics: true, marketing: true }), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:   ONE_YEAR,
        path:     "/",
    });
}

/** Decline optional cookies — necessary only */
export async function declineCookies() {
    const store = await cookies();
    store.set(COOKIE_NAME, JSON.stringify({ necessary: true, analytics: false, marketing: false }), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:   ONE_YEAR,
        path:     "/",
    });
}

/** Save custom cookie preferences */
export async function saveCustomCookies(prefs: Omit<CookieConsent, "necessary">) {
    const store = await cookies();
    store.set(COOKIE_NAME, JSON.stringify({ necessary: true, ...prefs }), {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:   ONE_YEAR,
        path:     "/",
    });
}

/** Read consent on the server — returns null if not yet set */
export async function getCookieConsent(): Promise<CookieConsent | null> {
    const store = await cookies();
    const raw   = store.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    try {
        return JSON.parse(raw) as CookieConsent;
    } catch {
        return null;
    }
}
