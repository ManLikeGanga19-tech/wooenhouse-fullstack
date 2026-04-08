import fs from "fs"
import path from "path"

export function getHeroImages() {
    const heroPath = path.join(process.cwd(), "public/hero")
    const files = fs.readdirSync(heroPath)

    // Only return image files
    return files
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .map((file) => `/hero/${file}`)
}
