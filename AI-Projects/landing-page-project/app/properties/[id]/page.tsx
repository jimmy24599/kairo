import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPropertyById } from '@/data/properties'
import type { Metadata } from 'next'
import { MapPin, Bed, Bath, Ruler, ArrowRight, Shield, Award, Building2 } from 'lucide-react'
import { ImageGallery } from '@/components/property/ImageGallery'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const property = getPropertyById(id)
  if (!property) return { title: 'Property Not Found' }
  return {
    title: `${property.title} | Antalia Properties`,
    description: property.description,
    openGraph: {
      title: property.title,
      description: property.description,
      images: property.images?.length ? [{ url: property.images[0].url }] : undefined
    }
  }
}

export default async function PropertyDetailsPage({ params }: PageProps) {
  const { id } = await params
  const property = getPropertyById(id)
  if (!property) return notFound()

  return (
    <div className="min-h-screen bg-[#0B0F19] text-zinc-100">
      {/* Top subtle background */}
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(80rem_40rem_at_10%_-10%,rgba(213,175,55,0.12),transparent),radial-gradient(60rem_40rem_at_90%_-10%,rgba(241,230,184,0.10),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-30 opacity-[0.15]" style={{ backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)' }} />

      <section className="relative pt-24">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                <Shield className="h-3.5 w-3.5 text-[#E5C970]" /> Antalia Exclusive • For {property.type}
              </div>
              <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{property.title}</h1>
              {property.subtitle && (
                <p className="mt-2 max-w-2xl text-zinc-400">{property.subtitle}</p>
              )}
              <div className="mt-3 flex items-center text-zinc-400">
                <MapPin className="mr-2 h-4 w-4" />
                <span>
                  {property.location.address}, {property.location.neighborhood ? property.location.neighborhood + ', ' : ''}
                  {property.location.city}, {property.location.country}
                </span>
              </div>
            </div>
            <div className="space-y-3 text-right">
              <div className="text-3xl font-semibold text-white">{property.price}</div>
              <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-zinc-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 inline-flex items-center gap-2"><Bed className="h-4 w-4 text-[#E5C970]" /> {property.bedrooms} Beds</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 inline-flex items-center gap-2"><Bath className="h-4 w-4 text-[#E5C970]" /> {property.bathrooms} Baths</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 inline-flex items-center gap-2"><Ruler className="h-4 w-4 text-[#E5C970]" /> {property.area}</span>
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="mt-8">
            <ImageGallery images={property.images} />
          </div>

          {/* Details grid */}
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {/* Description */}
            <div className="md:col-span-2">
              <h2 className="font-serif text-2xl">About this home</h2>
              <p className="mt-3 whitespace-pre-line text-zinc-300">{property.description}</p>

              {property.features?.length ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white">Highlights</h3>
                  <ul className="mt-3 grid grid-cols-1 gap-2 text-zinc-300 sm:grid-cols-2">
                    {property.features.map((f) => (
                      <li key={f} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{f}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {property.amenities?.length ? (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white">Amenities</h3>
                  <ul className="mt-3 grid grid-cols-2 gap-2 text-zinc-300 sm:grid-cols-3">
                    {property.amenities.map((a) => (
                      <li key={a} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{a}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <aside className="md:col-span-1">
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold">Schedule a private tour</h3>
                  <p className="mt-2 text-sm text-zinc-400">Connect with our senior advisor team for a discreet showing.</p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1E6B8] text-[#0B0F19]">
                      Request Tour
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="rounded-xl border-white/10 bg-white/5 text-zinc-100 hover:bg-white/10">
                      Download Brochure
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-sm font-semibold tracking-wide text-zinc-300">Listing details</h4>
                  <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                    <li>Type: For {property.type}</li>
                    {property.yearBuilt ? <li>Year built: {property.yearBuilt}</li> : null}
                    <li>Bedrooms: {property.bedrooms}</li>
                    <li>Bathrooms: {property.bathrooms}</li>
                    <li>Area: {property.area}</li>
                    <li>Location: {property.location.neighborhood ? property.location.neighborhood + ', ' : ''}{property.location.city}</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Award className="h-4 w-4 text-[#E5C970]" />
                    Antalia Certified Listing
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Recognition strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
            {[Award, Shield, Building2].map((Icon, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-[#E5C970]" />
                <span className="text-xs tracking-widest text-zinc-400">ANTALIA EXCLUSIVE</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
