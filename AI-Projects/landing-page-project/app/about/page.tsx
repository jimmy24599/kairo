import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Antalia Properties',
  description: 'Learn about Antalia Properties—our mission, values, and the people behind our platform.'
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7.5 2.25v6.75a9 9 0 01-7.5 8.82A9 9 0 014.5 12V5.25L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8l-1-3-1 3-3 1 3 1 1 3 1-3 3-1-3-1zM18 14l-.5-1.5L16 12l1.5-.5L18 10l.5 1.5L20 12l-1.5.5L18 14z" />
    </svg>
  );
}

function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l-2 2a2 2 0 01-2.83 0l-1.17-1.17a2 2 0 010-2.83l3-3a2 2 0 012.83 0L12 8l2-2a2 2 0 012.83 0l3 3a2 2 0 010 2.83L18.66 13a2 2 0 01-2.83 0L14 11" />
    </svg>
  );
}

function GlobeAltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.46 12h19.08M12 2.46c2.5 2.7 3.75 5.7 3.75 9.54S14.5 18.84 12 21.54M12 2.46C9.5 5.16 8.25 8.16 8.25 12s1.25 6.84 3.75 9.54" />
    </svg>
  );
}

export default function AboutPage(): JSX.Element {
  const stats = [
    { label: 'Properties listed', value: '2,500+' },
    { label: 'Clients served', value: '18k+' },
    { label: 'Years of experience', value: '12+' },
    { label: 'Cities covered', value: '25' }
  ];

  const values = [
    {
      title: 'Reliability',
      description: 'Accurate listings and transparent data you can rely on every step of the way.',
      Icon: ShieldCheckIcon,
    },
    {
      title: 'Innovation',
      description: 'Modern tools and delightful UX that make discovering property effortless.',
      Icon: SparklesIcon,
    },
    {
      title: 'Partnership',
      description: 'We build long-term relationships grounded in clarity and care.',
      Icon: HandshakeIcon,
    },
    {
      title: 'Community',
      description: 'Serving neighborhoods across the map with local insights that matter.',
      Icon: GlobeAltIcon,
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">About us</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Shaping the future of property discovery</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Antalia Properties is a modern platform for showcasing and discovering properties. Our mission is to make
            searching, evaluating, and comparing homes simple and enjoyable—whether you are buying, renting, or exploring.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
              Explore listings
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="text-3xl font-bold text-gray-900">{item.value}</div>
              <div className="mt-1 text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Story & Values */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Our story</h2>
              <p className="mt-4 text-gray-600">
                We started Antalia to solve a common problem: finding a home often feels overwhelming. Listings are
                inconsistent, information is scattered, and experiences are rarely tailored. We built a platform that
                centralizes high-quality data and pairs it with a thoughtful interface—so you can focus on what matters.
              </p>
              <ul className="mt-6 space-y-3 text-gray-700">
                <li className="flex gap-3"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-600" /> Curated, high-fidelity listings and media</li>
                <li className="flex gap-3"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-600" /> Clear pricing with no hidden surprises</li>
                <li className="flex gap-3"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-indigo-600" /> A fast, accessible, mobile-first experience</li>
              </ul>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {values.map(({ title, description, Icon }) => (
                <div key={title} className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 sm:p-12 text-white">
          <div className="max-w-3xl">
            <h3 className="text-2xl font-semibold sm:text-3xl">Ready to find your next place?</h3>
            <p className="mt-2 text-white/90">Browse our latest properties or compare plans to get more out of your search.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700">
                Browse properties
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-md border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-700">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
