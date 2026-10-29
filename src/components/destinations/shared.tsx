import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { destinationTemplate, guide, type Destination } from '../../data/destinations';

// Shared building blocks for the /destinations hub and destination pages.

export const container = 'max-w-[1280px] mx-auto px-4 sm:px-6';

export const btnPrimary =
  "inline-flex items-center justify-center min-h-[44px] bg-navy text-white font-['Inter'] text-[15px] font-medium px-7 py-3.5 rounded hover:bg-navy-dark transition-colors duration-200 focus-visible:outline-navy";
export const btnSecondary =
  "inline-flex items-center justify-center min-h-[44px] border border-navy text-navy font-['Inter'] text-[15px] font-medium px-7 py-3 rounded hover:bg-mint-light transition-colors duration-200 focus-visible:outline-navy";

const inputBase = "w-full min-h-[44px] font-['Inter'] text-base text-ink bg-white px-3.5 py-3 rounded focus:outline-none focus:ring-2";
export const inputClass = `${inputBase} border border-[#C7CDD4] focus:border-navy focus:ring-navy/30`;
// On navy bands the field has no border; the focus ring is mint so it shows on navy.
export const inputOnNavyClass = `${inputBase} border-0 focus:ring-mint focus:ring-offset-2 focus:ring-offset-navy`;

// White button for navy bands, with a white focus ring that shows on navy.
export const btnOnNavy =
  "inline-flex items-center justify-center min-h-[44px] bg-white text-navy font-['Inter'] text-[15px] font-medium px-7 py-3.5 rounded hover:bg-mint-light transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function Eyebrow({ children, onNavy = false }: { children: ReactNode; onNavy?: boolean }) {
  return (
    <span
      className={`font-['Inter'] text-[13px] font-semibold uppercase tracking-[0.16em] ${
        onNavy ? 'text-mint' : 'text-navy'
      }`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  body,
  onNavy = false,
}: {
  id: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  onNavy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 max-w-[680px]">
      {eyebrow && <Eyebrow onNavy={onNavy}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={`font-['Cormorant_Garamond'] font-semibold text-[clamp(32px,3.2vw,42px)] leading-[1.1] ${
          onNavy ? 'text-white' : 'text-navy'
        }`}
      >
        {title}
      </h2>
      {body && <p className="font-['Inter'] text-[17px] leading-[1.7]">{body}</p>}
    </div>
  );
}

// A photo slot: renders the image once a real path is supplied in the data,
// otherwise a striped placeholder captioned with the intended shot.
export function PhotoSlot({
  photo,
  alt,
  className = '',
  tone = 'mint',
  square = false,
}: {
  photo: string;
  alt: string;
  className?: string;
  tone?: 'mint' | 'deep' | 'navy';
  square?: boolean;
}) {
  const radius = square ? '' : 'rounded-md';
  if (photo.startsWith('/')) {
    return <img src={photo} alt={alt} loading="lazy" className={`object-cover w-full ${radius} ${className}`} />;
  }
  const stripes = {
    mint: 'repeating-linear-gradient(135deg, #DCEAE8 0 14px, #E8F1F0 14px 28px)',
    deep: 'repeating-linear-gradient(135deg, #D3E5E2 0 14px, #DFECEA 14px 28px)',
    navy: 'repeating-linear-gradient(135deg, #2A5079 0 14px, #2F5682 14px 28px)',
  }[tone];
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex items-end p-3.5 ${radius} ${className}`}
      style={{ background: stripes }}
    >
      <span className={`font-['Inter'] text-[13px] ${tone === 'navy' ? 'text-mint' : 'text-navy'}`}>{photo}</span>
    </div>
  );
}

function statusLabel(d: Destination) {
  return d.status === 'inspected' ? destinationTemplate.inspectedBadge : destinationTemplate.scheduledBadge;
}

// Hub cards use a navy-filled badge for inspected destinations; the
// destination page hero uses a mint badge with a tick. Scheduled is dashed in both.
export function StatusBadge({ destination, variant }: { destination: Destination; variant: 'card' | 'hero' }) {
  const label = statusLabel(destination);
  if (destination.status === 'scheduled') {
    return (
      <span className="inline-flex items-center font-['Inter'] text-xs font-semibold text-navy bg-white border border-dashed border-navy px-2.5 py-1.5 rounded">
        {label}
      </span>
    );
  }
  if (variant === 'card') {
    return (
      <span className="inline-flex items-center font-['Inter'] text-xs font-semibold text-white bg-navy px-2.5 py-1.5 rounded">
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-['Inter'] text-[13px] font-semibold text-navy bg-mint px-3 py-1.5 rounded">
      <Check className="w-3.5 h-3.5" strokeWidth={2.6} aria-hidden="true" />
      {label}
    </span>
  );
}


// Shown in place of a form after a successful submit.
export function GuideConfirmation({ title, body, onNavy = false }: { title: string; body?: string; onNavy?: boolean }) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <p className={`font-['Cormorant_Garamond'] text-[28px] font-semibold ${onNavy ? 'text-white' : 'text-navy'}`}>
        {title}
      </p>
      {body && <p className={`font-['Inter'] text-base leading-[1.7] ${onNavy ? 'text-white/85' : ''}`}>{body}</p>}
      {guide.pdfUrl ? (
        <a
          href={guide.pdfUrl}
          download
          className={`${onNavy ? btnOnNavy : btnPrimary} self-start`}
        >
          {guide.downloadLabel}
        </a>
      ) : (
        <p className={`font-['Inter'] text-base ${onNavy ? 'text-mint' : 'text-navy font-medium'}`}>{guide.emailedLine}</p>
      )}
    </div>
  );
}
