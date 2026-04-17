"use client"

import { useState, useRef } from "react"
import { useGoogleReCaptcha } from "react-google-recaptcha-v3"
import Image from "next/image"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MapPin, Phone, Mail, Clock, Send, MessageSquare,
  Home, Hammer, CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api/client"

const INITIAL_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  serviceType: "", projectLocation: "", budget: "",
  timeline: "", message: "", newsletter: false,
}

export default function ContactPage() {
  const [formData,    setFormData]    = useState(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted,   setSubmitted]   = useState(false)
  const loadedAt = useRef(Date.now())
  const [hp, setHp] = useState("")
  const { executeRecaptcha } = useGoogleReCaptcha()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const recaptchaToken = executeRecaptcha ? await executeRecaptcha("contact_form") : undefined

      await api.contact.submit({
        name:           `${formData.firstName} ${formData.lastName}`.trim(),
        email:          formData.email,
        phone:          formData.phone,
        serviceType:    formData.serviceType,
        location:       formData.projectLocation,
        budget:         formData.budget,
        timeline:       formData.timeline,
        message:        formData.message,
        newsletter:     formData.newsletter,
        hp,
        loadedAt:       loadedAt.current,
        recaptchaToken,
      })

      toast.success("Message sent successfully!")
      setSubmitted(true)
    } catch (err) {
      toast.error("Failed to send message", {
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: <MapPin size={28} style={{ color: "#8B5E3C" }} />,
      title: "Visit Our Office",
      details: ["Naivasha, Kenya", "Open for site visits by appointment"],
      link: null,
    },
    {
      icon: <Phone size={28} style={{ color: "#8B5E3C" }} />,
      title: "Call Us",
      details: ["+254 716 111 187", "+254 789 104 438"],
      link: "tel:+254716111187",
    },
    {
      icon: <Mail size={28} style={{ color: "#8B5E3C" }} />,
      title: "Email Us",
      details: ["info@woodenhouseskenya.com", "We reply within 24 hours"],
      link: "mailto:info@woodenhouseskenya.com",
    },
    {
      icon: <Clock size={28} style={{ color: "#8B5E3C" }} />,
      title: "Working Hours",
      details: ["Monday - Friday: 8AM - 6PM", "Saturday: 9AM - 4PM"],
      link: null,
    },
  ]

  const services = [
    { value: "wooden-house",  label: "Wooden House Construction", icon: <Home size={20} /> },
    { value: "carpentry",     label: "General Carpentry",          icon: <Hammer size={20} /> },
    { value: "consultation",  label: "Design Consultation",        icon: <MessageSquare size={20} /> },
    { value: "other",         label: "Other Services",             icon: <CheckCircle2 size={20} /> },
  ]

  return (
    <div className="min-h-screen bg-white w-full max-w-full overflow-hidden">

      {/* Page Header */}
      <div className="relative w-full py-8 sm:py-12 border-b border-gray-200 overflow-hidden">
        <Image src="/contact/contact-header1.jpg" alt="Contact" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4" style={{ color: "#C49A6C" }} data-aos="fade-down">
            Contact Us
          </h1>
          <Breadcrumb>
            <BreadcrumbList className="text-white/90 text-sm sm:text-base">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="hover:text-[#C49A6C] transition">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white/90" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/contact" className="text-[#C49A6C] font-medium">Contact</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">

        {/* Intro */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16" data-aos="fade-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6" style={{ color: "#8B5E3C" }}>
            Let&apos;s Build Something Amazing Together
          </h2>
          <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
            Whether you&apos;re planning a new wooden house, need custom carpentry, or want to discuss
            your project ideas, our team is here to help. Fill out the form below and we&apos;ll get
            back to you within 24 hours.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 sm:mb-20">
          {contactInfo.map((info, index) => (
            <Card
              key={index}
              className="border-2 border-gray-100 hover:border-[#8B5E3C] transition-all duration-300 hover:shadow-lg"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardHeader>
                <div className="mb-4">{info.icon}</div>
                <CardTitle className="text-lg sm:text-xl" style={{ color: "#8B5E3C" }}>{info.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {info.details.map((detail, i) => (
                  <p key={i} className="text-gray-700 text-sm sm:text-base mb-1">
                    {info.link && i === 0
                      ? <a href={info.link} className="hover:text-[#8B5E3C] transition-colors font-medium">{detail}</a>
                      : detail}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-12">

          {/* Contact Form */}
          <div className="lg:col-span-3" data-aos="fade-right">
            <Card className="border-2 border-gray-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl" style={{ color: "#8B5E3C" }}>
                  {submitted ? "Message Received!" : "Request a Free Quote"}
                </CardTitle>
                <CardDescription className="text-base">
                  {submitted
                    ? "Thank you for reaching out. We'll get back to you within 24 hours."
                    : "Tell us about your project and we'll provide a detailed estimate"}
                </CardDescription>
              </CardHeader>
              <CardContent>

                {/* Success state — shown after submission */}
                {submitted && (
                  <div className="py-10 flex flex-col items-center gap-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 size={44} className="text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700 text-base sm:text-lg">
                        We&apos;ve received your enquiry and will be in touch soon.
                      </p>
                      <p className="text-gray-500 text-sm">
                        In the meantime, feel free to call us on{" "}
                        <a href="tel:+254716111187" className="font-medium" style={{ color: "#8B5E3C" }}>
                          +254 716 111 187
                        </a>
                      </p>
                    </div>
                    <Button
                      onClick={() => { setSubmitted(false); setFormData(INITIAL_FORM) }}
                      variant="outline"
                      className="border-2 hover:scale-105 transition-all"
                      style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}
                    >
                      Send another message
                    </Button>
                  </div>
                )}

                {/* Form — hidden after submission */}
                {!submitted && <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" placeholder="John" value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required className="border-2 focus:border-[#8B5E3C]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" placeholder="Doe" value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required className="border-2 focus:border-[#8B5E3C]" />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" placeholder="john@example.com" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required className="border-2 focus:border-[#8B5E3C]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="+254 700 000 000" value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="border-2 focus:border-[#8B5E3C]" />
                    </div>
                  </div>

                  {/* Service */}
                  <div className="space-y-2">
                    <Label>Service Type *</Label>
                    <Select value={formData.serviceType}
                      onValueChange={(value) => setFormData({ ...formData, serviceType: value })} required>
                      <SelectTrigger className="border-2 focus:border-[#8B5E3C]">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">{s.icon}<span>{s.label}</span></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Details */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectLocation">Project Location</Label>
                      <Input id="projectLocation" placeholder="e.g., Nairobi, Naivasha" value={formData.projectLocation}
                        onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                        className="border-2 focus:border-[#8B5E3C]" />
                    </div>
                    <div className="space-y-2">
                      <Label>Budget Range (KSH)</Label>
                      <Select value={formData.budget}
                        onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                        <SelectTrigger className="border-2 focus:border-[#8B5E3C]">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-500k">Under 500K</SelectItem>
                          <SelectItem value="500k-1m">500K – 1M</SelectItem>
                          <SelectItem value="1m-2m">1M – 2M</SelectItem>
                          <SelectItem value="2m-5m">2M – 5M</SelectItem>
                          <SelectItem value="over-5m">Over 5M</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <Label>Project Timeline</Label>
                    <Select value={formData.timeline}
                      onValueChange={(value) => setFormData({ ...formData, timeline: value })}>
                      <SelectTrigger className="border-2 focus:border-[#8B5E3C]">
                        <SelectValue placeholder="When do you want to start?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent (Within 1 month)</SelectItem>
                        <SelectItem value="1-3months">1–3 months</SelectItem>
                        <SelectItem value="3-6months">3–6 months</SelectItem>
                        <SelectItem value="6-12months">6–12 months</SelectItem>
                        <SelectItem value="planning">Just planning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Project Details *</Label>
                    <Textarea id="message"
                      placeholder="Tell us about your project, requirements, and any specific questions..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required rows={5} className="border-2 focus:border-[#8B5E3C] resize-none" />
                  </div>

                  {/* Newsletter */}
                  <div
                    className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-100 hover:border-[#8B5E3C] transition-colors cursor-pointer"
                    onClick={() => setFormData(prev => ({ ...prev, newsletter: !prev.newsletter }))}
                  >
                    <Checkbox
                      id="newsletter"
                      checked={formData.newsletter}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, newsletter: checked === true }))
                      }
                      className="mt-0.5 shrink-0"
                      style={{ accentColor: "#8B5E3C" }}
                    />
                    <div className="select-none">
                      <p className="text-sm font-medium text-gray-800">
                        Subscribe to our newsletter
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Get updates on new projects, offers, and wooden house tips
                      </p>
                    </div>
                  </div>

                  {/* Honeypot — invisible to humans, bots fill it */}
                  <input
                    type="text"
                    name="website"
                    value={hp}
                    onChange={e => setHp(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    style={{ position: "absolute", opacity: 0, height: 0, width: 0, border: 0, padding: 0 }}
                  />

                  {/* Submit */}
                  <Button type="submit" disabled={isSubmitting}
                    className="w-full py-6 text-lg font-semibold shadow-lg hover:scale-[1.02] transition-all"
                    style={{ background: "#8B5E3C", color: "white" }}>
                    {isSubmitting ? "Sending..." : (
                      <span className="flex items-center justify-center gap-2">
                        <Send size={20} /> Send Message
                      </span>
                    )}
                  </Button>
                </form>}

              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-8" data-aos="fade-left">
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl" style={{ color: "#8B5E3C" }}>
                  Why Contact Us?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  "Free consultation and project assessment",
                  "Detailed quote within 48 hours",
                  "8+ years of experience in wooden construction",
                  "Transparent pricing with no hidden costs",
                  "Dedicated project manager for your build",
                  "Quality guarantee on all work",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="shrink-0 mt-0.5" style={{ color: "#8B5E3C" }} />
                    <span className="text-gray-700 text-sm sm:text-base">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl" style={{ color: "#8B5E3C" }}>
                  Visit Our Office
                </CardTitle>
                <CardDescription>
                  Schedule a visit to see our showroom and discuss your project in person
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-[200px] sm:h-[250px] rounded-lg overflow-hidden mb-4">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63820.89!2d36.4263!3d-0.7167!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182985b04b92f14d%3A0x8e87c4c7d1e3e3f!2sNaivasha%2C%20Kenya!5e0!3m2!1sen!2ske!4v1"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Wooden Houses Kenya office location"
                  />
                </div>
                <Button asChild variant="outline" className="w-full border-2 hover:scale-105 transition-all"
                  style={{ borderColor: "#8B5E3C", color: "#8B5E3C" }}>
                  <a href="https://maps.google.com/?q=Naivasha+Kenya" target="_blank" rel="noopener noreferrer">
                    <MapPin size={18} className="mr-2" /> Get Directions
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
