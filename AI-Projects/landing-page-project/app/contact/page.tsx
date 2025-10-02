import type { Metadata } from 'next'
import Image from 'next/image'
import { ContactForm } from '@/components/contact/ContactForm'
import { MapPin, Shield, Award, Building2, Phone, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Antalia Properties',
  description: 'Begin your private consultation with Antalia Properties. Contact our senior advisors for bespoke real estate guidance.'
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(80rem_40rem_at_10%_-10%,rgba(213,175,55,0.12),transparent),radial-gradient(60rem_40rem_at_90%_-10%,rgba(241,230,184,0.10),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-30 opacity-[0.15]" style={{ backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)' }} />

      <section className="relative overflow-hidden pt-28 pb-16">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?w=2400&auto=format&fit=crop&q=80"
            alt="Luxury residence skyline"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0B0F19]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/20 to-[#0B0F19]/40" />
        </div>

        <div className="container mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 backdrop-blur">
              Begin Your Consultation
            </div>
            <h1 className="mt-6 font-serif text-5xl leading-tight tracking-tight md:text-6xl">
              Contact Antalia Properties
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-300">
              Speak with our senior advisors for discreet, bespoke guidance on luxury real estate acquisitions and rentals.
            </p>
          </div>
        </div>
      </section>

      <section className="relative pb-20">
        <div className="container mx-auto grid gap-8 px-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h2 className="font-serif text-3xl">Send Us a Message</h2>
              <p className="mt-2 text-zinc-400">We aim to respond within one business day.</p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>

          <aside className="md:col-span-2">
            <div className="grid gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Direct Contact</h3>
                <div className="mt-4 space-y-3 text-zinc-300">
                  <div className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-[#E5C970]" /><div>+1 (555) 123-4567</div></div>
                  <div className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-[#E5C970]" /><div>info@antaliaproperties.com</div></div>
                  <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-[#E5C970]" /><div>123 Luxury Avenue, Antalia City</div></div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Why Antalia</h3>
                <ul className="mt-4 space-y-3 text-sm text-zinc-300">
                  <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 text-[#E5C970]" /> Private, confidential brokerage</li>
                  <li className="flex items-start gap-2"><Award className="mt-0.5 h-4 w-4 text-[#E5C970]" /> Tailored curation of residences</li>
                  <li className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 text-[#E5C970]" /> Access to exclusive, off‑market listings</li>
                </ul>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="relative h-56 w-full">
                  <Image
                    src="https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&auto=format&fit=crop&q=80"
                    alt="Antalia Properties Office"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent" />
                </div>
                <div className="p-4 text-sm text-zinc-300">
                  Visit our flagship office in Antalia City for a private consultation.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
