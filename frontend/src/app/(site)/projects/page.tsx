import type { Metadata } from "next"
import ProjectsClient from "./ProjectsClient"

export const metadata: Metadata = {
    title: "Projects & Gallery",
    description: "Browse 37+ completed wooden construction projects across Kenya — custom houses, eco-cabins, commercial buildings, custom furniture, and outdoor structures by Wooden Houses Kenya.",
    alternates: { canonical: "/projects" },
    openGraph: {
        title: "Projects & Gallery | Wooden Houses Kenya Portfolio",
        description: "Explore our portfolio of 37+ completed projects — wooden houses, eco-lodges, commercial buildings, furniture, and outdoor structures built across Kenya and East Africa.",
        url: "https://woodenhouseskenya.com/projects",
        images: [{ url: "/projects/projects-header.jpg", width: 1200, height: 630, alt: "Wooden Houses Kenya Projects Gallery" }],
    },
    twitter: {
        title: "Projects & Gallery | Wooden Houses Kenya",
        description: "37+ completed projects — wooden homes, commercial buildings, furniture & outdoor structures across Kenya.",
        images: ["/projects/projects-header.jpg"],
    },
}

export default function ProjectsPage() {
    return <ProjectsClient />
}
