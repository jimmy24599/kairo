import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Testimonials | Antalia Properties',
  description: 'Hear from clients who bought and sold luxury properties with Antalia Properties.',
};

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      location: 'Palm Jumeirah, Dubai',
      quote:
        'Antalia Properties helped us find our dream waterfront villa. The team handled everything with discretion and precision—truly best-in-class service.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      location: 'Downtown Dubai',
      quote:
        'Professional, knowledgeable, and incredibly responsive. They made the entire purchase process seamless from viewing to handover.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      location: 'Emirates Hills',
      quote:
        'Their market insight and attention to detail are unmatched. I felt supported and informed at every step.',
      rating: 5,
    },
    {
      name: 'Omar Al‑Farsi',
      location: 'Saadiyat Island, Abu Dhabi',
      quote:
        'Discreet, efficient, and results-driven. Antalia secured an incredible off-market opportunity for my family.',
      rating: 5,
    },
    {
      name: 'Isabella Rossi',
      location: 'JBR, Dubai Marina',
      quote:
        'From the first call to closing, the experience was exceptional. Highly recommended for luxury buyers.',
      rating: 5,
    },
    {
      name: 'Daniel Smith',
      location: 'Arabian Ranches',
      quote:
        'The team negotiated superbly on our behalf and coordinated all the details flawlessly. Five stars.',
      rating: 5,
    },
  ];

  const Stars = ({ rating }: { rating: number }) => (
    <div className="flex text-yellow-400" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? '' : 'text-gray-300'}>★</span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">What Our Clients Say</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            We are proud to serve discerning buyers and sellers across Dubai and Abu Dhabi with unparalleled service and results.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <Stars rating={t.rating} />
              <p className="mt-4 text-gray-700 italic">“{t.quote}”</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-700">
                  {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold">Ready to discover your next luxury property?</h2>
          <p className="mt-2 text-gray-600">Speak with our specialist advisors for private viewings and off-market opportunities.</p>
          <a
            href="/contact"
            className="inline-block mt-6 px-6 py-3 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
