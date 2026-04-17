export const FAQS = [
    {
        q: "How much does a wooden house cost in Kenya?",
        a: "The cost depends on size, design and finishes. A basic one-bedroom structure of around 40 square metres starts from KES 900,000. Larger family homes of 80 to 120 square metres range from KES 1,800,000 to KES 3,500,000. We provide free, site-specific quotes — contact us with your location and requirements.",
    },
    {
        q: "How long does it take to build a wooden house in Kenya?",
        a: "Most of our projects are completed in 4 to 9 weeks from ground-breaking to handover. Smaller cabins and garden offices can be done in 2 to 3 weeks. This is significantly faster than brick and mortar construction, which typically takes 7 to 12 months for a comparable structure.",
    },
    {
        q: "Are wooden houses durable in Kenya's climate?",
        a: "Yes. We use pressure-treated, kiln-dried timber that resists termites, moisture and UV damage. Our structures are designed for Kenya's varied conditions — from the cool highlands of Nanyuki to Naivasha's lakeside humidity. With routine maintenance every 5 to 7 years, a well-built wooden house lasts 40 to 60 years.",
    },
    {
        q: "Do you build wooden houses outside Nairobi?",
        a: "We build across the whole country. Completed projects include Naivasha, Nanyuki, Laikipia, Taita Taveta, Karen and many other locations. We handle all logistics including material transport to remote sites. Tell us your location and we will build a quote around it.",
    },
    {
        q: "How do wooden houses compare to brick houses in Kenya?",
        a: "Wooden houses are faster to build, naturally better insulated for temperature control, and generally more affordable per square metre. Brick houses can carry higher resale value in dense urban markets. For holiday homes, eco-lodges, staff quarters, garden offices and rural properties, timber construction is usually the stronger choice.",
    },
    {
        q: "Do you offer a warranty on your structures?",
        a: "Yes. We provide a structural warranty on all completed builds and stand behind the quality of our work. We have been building wooden structures since 2016. We also offer maintenance packages and remain available for post-construction support.",
    },
]

export const faqJsonLd = {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
        "@type":        "Question",
        name:           q,
        acceptedAnswer: { "@type": "Answer", text: a },
    })),
}
