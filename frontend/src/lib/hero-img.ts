import fs from "fs"
import path from "path"

const FORMAT_PRIORITY: Record<string, number> = { webp: 0, jpg: 1, png: 2, jpeg: 3 }

export function getHeroImages() {
    const heroPath = path.join(process.cwd(), "public/hero")
    const files = fs.readdirSync(heroPath)

    // Deduplicate by stem — prefer webp > jpg > png > jpeg
    const best = new Map<string, string>()
    for (const file of files) {
        const match = file.match(/^(.+)\.([a-z]+)$/i)
        if (!match) continue
        const [, stem, ext] = match
        const extLower = ext.toLowerCase()
        if (!(extLower in FORMAT_PRIORITY)) continue
        const existing = best.get(stem)
        if (!existing || FORMAT_PRIORITY[extLower] < FORMAT_PRIORITY[existing.split(".").pop()!.toLowerCase()]) {
            best.set(stem, file)
        }
    }

    return Array.from(best.values())
        .sort()
        .map((file) => `/hero/${file}`)
}
