'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { properties as allProperties, type Property } from '@/data/properties'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Filter, MapPin, Home, Key, X } from 'lucide-react'

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

export default function PropertiesPage() {
  const [q, setQ] = useState('')
  const [type, setType] = useState<'All' | 'Sale' | 'Rent'>('All')
  const [minBeds, setMinBeds] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(0) // 0 means no cap
  const [activeTags, setActiveTags] = useState<string[]>([])

  const tags = ['Beachfront', 'Penthouse', 'Gated Community', 'Marina View']

  const filtered = useMemo(() => {
    return allProperties.filter((p) => {
      const matchesQuery = q
        ? [p.title, p.location, p.area].some((f) => f.toLowerCase().includes(q.toLowerCase()))
        : true
      const matchesType = type === 'All' ? true : p.type === type
      const matchesBeds = p.bedrooms >= minBeds
      const matchesPrice = maxPrice > 0 ? p.priceValue <= maxPrice : true
      const matchesTags = activeTags.length === 0 ? true : activeTags.some((t) =>
        (t === 'Beachfront' && /sea|coast|beach|marina/i.test(p.location + ' ' + p.title)) ||
        (t === 'Penthouse' && /penthouse|sky|loft/i.test(p.title)) ||
        (t === 'Gated Community' && /estate|ridge|gated/i.test(p.title)) ||
        (t === 'Marina View' && /marina|harbor/i.test(p.location + ' ' + p.title))
      )
      return matchesQuery && matchesType && matchesBeds && matchesPrice && matchesTags
    })
  }, [q, type, minBeds, maxPrice, activeTags])

  const clearAll = () => {
    setQ('')
    setType('All')
    setMinBeds(0)
    setMaxPrice(0)
    setActiveTags([])
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(80rem_40rem_at_10%_-10%,rgba(213,175,55,0.12),transparent),radial-gradient(60rem_40rem_at_90%_-10%,rgba(241,230,184,0.10),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-30 opacity-[0.15]" style={{ backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)' }} />

      {/* Header / Hero */}
      <section className="relative pt-28 pb-10">
        <div className="container mx-auto px-6">
          <motion.div initial="hidden" animate="show" variants={fadeIn} className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <Filter className="h-3.5 w-3.5 text-[#E5C970]" />
              Curated Listings
            </div>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight md:text-6xl">Explore Our Properties</h1>
            <p className="mt-4 text-lg text-zinc-300">Browse exceptional homes for sale and rent across premier neighborhoods. Refined search to find your perfect match.</p>
          </motion.div>

          {/* Controls */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="grid gap-3 md:grid-cols-5">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3 md:col-span-2">
                <MapPin className="h-5 w-5 text-[#E5C970]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by location, title, or area"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
                  aria-label="Search"
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3">
                <Home className="h-5 w-5 text-[#E5C970]" />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'All' | 'Sale' | 'Rent')}
                  className="w-full bg-transparent text-sm outline-none"
                  aria-label="Listing Type"
                >
                  <option className="bg-[#0B0F19]" value="All">All</option>
                  <option className="bg-[#0B0F19]" value="Sale">For Sale</option>
                  <option className="bg-[#0B0F19]" value="Rent">For Rent</option>
                </select>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3">
                <Key className="h-5 w-5 text-[#E5C970]" />
                <input
                  type="number"
                  min={0}
                  value={minBeds}
                  onChange={(e) => setMinBeds(Math.max(0, Number(e.target.value)))}
                  placeholder="Min. Bedrooms"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
                  aria-label="Minimum bedrooms"
                />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3">
                <span className="h-5 w-5 rounded-sm bg-gradient-to-r from-[#D4AF37] to-[#F1E6B8]" />
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(0, Number(e.target.value)))}
                  placeholder="Max Price (USD)"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
                  aria-label="Maximum price"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tags.map((tag) => {
                const active = activeTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition ${active ? 'border-[#E5C970]/40 bg-[#E5C970]/15 text-zinc-100' : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                    aria-pressed={active}
                  >
                    {tag}
                    {active && <X className="h-3 w-3 opacity-70" />}
                  </button>
                )
              })}

              {(q || type !== 'All' || minBeds > 0 || maxPrice > 0 || activeTags.length > 0) && (
                <Button onClick={clearAll} className="ml-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10">
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="relative pb-24">
        <div className="container mx-auto px-6">
          <div className="mb-6 flex items-center justify-between text-sm text-zinc-400">
            <div>{filtered.length} properties found</div>
            <div className="hidden items-center gap-2 md:flex">
              <span>Sort by:</span>
              <select
                onChange={(e) => {
                  const v = e.target.value
                  const sorted = [...filtered]
                  if (v === 'price-asc') sorted.sort((a, b) => a.priceValue - b.priceValue)
                  if (v === 'price-desc') sorted.sort((a, b) => b.priceValue - a.priceValue)
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-zinc-200 outline-none"
                aria-label="Sort properties"
              >
                <option className="bg-[#0B0F19]" value="relevance">Relevance</option>
                <option className="bg-[#0B0F19]" value="price-asc">Price: Low to High</option>
                <option className="bg-[#0B0F19]" value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-zinc-300">No properties match your filters.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5 }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image src={p.image} alt={p.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent" />
                    <div className="absolute right-3 top-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{p.price}</div>
                  </div>
                  <div className="p-5">
                    <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">For {p.type}</div>
                    <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                    <div className="mt-1 flex items-center text-sm text-zinc-400">
                      <MapPin className="mr-2 h-4 w-4" /> {p.location}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                      <span>{p.bedrooms} Beds</span>
                      <span>{p.bathrooms} Baths</span>
                      <span>{p.area}</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <Button className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F1E6B8] px-4 py-2 text-[#0B0F19]">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <div className="text-xs text-zinc-400">Antalia Exclusive</div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
