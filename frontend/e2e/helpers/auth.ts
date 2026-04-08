/**
 * E2E auth helpers.
 *
 * We log in via the real backend API (not the UI) to get a valid httpOnly
 * cookie, then inject it into the Playwright browser context.  This keeps
 * auth-dependent tests fast without coupling them to login UI changes.
 */

import type { BrowserContext } from "@playwright/test";
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function loginViaApi(
  context: BrowserContext,
  email    = "admin@woodenhouseskenya.com",
  password = "DevAdmin@2024!"
) {
  // Hit the backend login endpoint directly
  const res = await axios.post(
    `${BACKEND_URL}/api/auth/login`,
    { email, password },
    { withCredentials: true }
  );

  // Extract the Set-Cookie header and inject it into the browser context
  const rawCookies: string[] = Array.isArray(res.headers["set-cookie"])
    ? res.headers["set-cookie"]
    : [res.headers["set-cookie"] as string];

  for (const raw of rawCookies.filter(Boolean)) {
    const [nameValue, ...attributes] = raw.split(";");
    const [name, value] = nameValue.split("=");

    const attrMap = Object.fromEntries(
      attributes.map(a => {
        const [k, v = "true"] = a.trim().split("=");
        return [k.toLowerCase().trim(), v.trim()];
      })
    );

    await context.addCookies([{
      name:     name.trim(),
      value:    value?.trim() ?? "",
      domain:   "localhost",
      path:     attrMap["path"] ?? "/",
      secure:   "secure" in attrMap,
      httpOnly: "httponly" in attrMap,
      sameSite: (attrMap["samesite"] as "Lax" | "Strict" | "None") ?? "Lax",
    }]);
  }

  return res.data;
}
