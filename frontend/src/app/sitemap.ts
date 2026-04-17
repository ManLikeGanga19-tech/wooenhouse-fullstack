import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://woodenhouseskenya.com";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url:              `${BASE_URL}/`,
            lastModified:     new Date(),
            changeFrequency:  "weekly",
            priority:         1.0,
        },
        {
            url:              `${BASE_URL}/about`,
            lastModified:     new Date(),
            changeFrequency:  "monthly",
            priority:         0.8,
        },
        {
            url:              `${BASE_URL}/services`,
            lastModified:     new Date(),
            changeFrequency:  "monthly",
            priority:         0.9,
        },
        {
            url:              `${BASE_URL}/projects`,
            lastModified:     new Date(),
            changeFrequency:  "weekly",
            priority:         0.9,
        },
        {
            url:              `${BASE_URL}/contact`,
            lastModified:     new Date(),
            changeFrequency:  "yearly",
            priority:         0.7,
        },
        {
            url:              `${BASE_URL}/blog`,
            lastModified:     new Date(),
            changeFrequency:  "weekly",
            priority:         0.8,
        },
        {
            url:              `${BASE_URL}/nairobi`,
            lastModified:     new Date(),
            changeFrequency:  "monthly",
            priority:         0.85,
        },
        {
            url:              `${BASE_URL}/naivasha`,
            lastModified:     new Date(),
            changeFrequency:  "monthly",
            priority:         0.85,
        },
        {
            url:              `${BASE_URL}/nanyuki`,
            lastModified:     new Date(),
            changeFrequency:  "monthly",
            priority:         0.85,
        },
    ];
}
