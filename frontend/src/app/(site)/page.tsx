import { getHeroImages } from "@/lib/hero-img"
import Hero from "@/components/sections/Hero"
import Steps from "@/components/sections/Steps"
import About from "@/components/sections/About"
import Services from "@/components/sections/Services"
import WhyChooseUs from "@/components/sections/Why"
import Partners from "@/components/sections/Partners"
import Projects from "@/components/sections/Project"

export default function Home() {
  const images = getHeroImages()  // Load hero images server-side

  return (
    <div className="flex flex-col w-full">

      {/* HERO SECTION */}
      <Hero images={images} />
      <Steps />
      <About />
      <Partners />
      <Services />
      <WhyChooseUs />
      <Projects />

    </div>
  )
}
