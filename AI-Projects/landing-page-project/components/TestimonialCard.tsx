import React from 'react';

export type TestimonialCardProps = {
  name: string;
  quote: string;
  role?: string;
  company?: string;
  avatarUrl?: string;
  rating?: number; // 0-5
  date?: string; // e.g., 'Aug 2025'
  className?: string;
  highlight?: boolean; // visually emphasize the card
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={(filled ? 'text-yellow-400' : 'text-gray-300 dark:text-neutral-700') + ' h-4 w-4 flex-shrink-0'}
      fill="currentColor"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.801 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.801-2.035a1 1 0 00-1.175 0l-2.8 2.035c-.786.57-1.84-.197-1.54-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function Stars({ rating = 5, outOf = 5 }: { rating?: number; outOf?: number }) {
  const safeRating = Math.max(0, Math.min(outOf, Math.round(rating)));
  return (
    <div className="flex items-center" aria-label={`Rated ${safeRating} out of ${outOf} stars`}>
      {Array.from({ length: outOf }).map((_, i) => (
        <Star key={i} filled={i < safeRating} />
      ))}
    </div>
  );
}

export default function TestimonialCard({
  name,
  quote,
  role,
  company,
  avatarUrl,
  rating = 5,
  date,
  className,
  highlight = false,
}: TestimonialCardProps) {
  const initials = getInitials(name);

  const emphasisRing = highlight
    ? 'ring-2 ring-amber-400 shadow-amber-200/40'
    : 'ring-1 ring-gray-100 dark:ring-neutral-800';

  return (
    <figure
      className={[
        'relative bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200',
        'overflow-hidden',
        emphasisRing,
        className ?? '',
      ].join(' ')}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-neutral-700">
            {avatarUrl ? (
              // Using <img> instead of next/image to avoid domain config requirements
              <img
                src={avatarUrl}
                alt={`${name} avatar`}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <figcaption className="min-w-0">
                <div className="truncate font-semibold text-gray-900 dark:text-white">{name}</div>
                {(role || company) && (
                  <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {role}
                    {role && company ? ' · ' : ''}
                    {company}
                  </div>
                )}
                {date && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{date}</div>
                )}
              </figcaption>
              <Stars rating={rating} />
            </div>

            <blockquote className="mt-4">
              <p className="text-gray-700 dark:text-gray-200 leading-7 italic">“{quote}”</p>
            </blockquote>
          </div>
        </div>
      </div>
    </figure>
  );
}
