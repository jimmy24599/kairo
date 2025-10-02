'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Images as ImagesIcon } from 'lucide-react'
import type { PropertyImage } from '@/types/property'
import { Button } from '@/components/ui/button'

interface ImageGalleryProps {
  images: PropertyImage[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const openAt = (i: number) => {
    setIndex(i)
    setIsOpen(true)
  }

  const close = useCallback(() => setIsOpen(false), [])

  const prev = useCallback(() => setIndex((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIndex((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close, prev, next])

  if (!images?.length) return null

  return (
    <div className="w-full">
      {/* Grid preview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {/* Main image */}
        <button
          onClick={() => openAt(0)}
          className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:col-span-2 md:row-span-2 md:aspect-[16/9]"
          aria-label="Open gallery"
        >
          <Image
            src={images[0].url}
            alt={images[0].alt}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            sizes="(min-width: 1024px) 66vw, 100vw"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent p-3 text-sm text-white">
            <span className="inline-flex items-center gap-2"><ImagesIcon className="h-4 w-4 text-[#E5C970]" /> {images.length} Photos</span>
            <span className="rounded-full bg-white/10 px-3 py-1">View all</span>
          </div>
        </button>

        {/* Thumbnails */}
        {images.slice(1, 5).map((img, i) => (
          <button
            key={img.url}
            onClick={() => openAt(i + 1)}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5"
            aria-label={`Open photo ${i + 2}`}
          >
            <Image src={img.url} alt={img.alt} fill className="object-cover transition-transform duration-700 hover:scale-105" sizes="(min-width: 1024px) 33vw, 50vw" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            aria-modal="true"
            role="dialog"
          >
            <button
              onClick={close}
              className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative h-[70vh] w-full max-w-6xl"
            >
              <Image
                src={images[index].url}
                alt={images[index].alt}
                fill
                className="rounded-xl object-contain"
                sizes="(min-width: 1280px) 1024px, 100vw"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ImageGallery
