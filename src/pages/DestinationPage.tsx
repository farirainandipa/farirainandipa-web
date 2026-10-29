import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Seo from '../components/Seo';
import { destinationTemplate as t, getDestination, type Destination } from '../data/destinations';
import {
  Eyebrow,
  GuideConfirmation,
  PhotoSlot,
  SectionHeading,
  StatusBadge,
  btnOnNavy,
  btnPrimary,
  container,
  inputOnNavyClass,
} from '../components/destinations/shared';
import { emailPattern, submitDestinationLead } from '../components/destinations/leads';

const anchorOffset = 'scroll-mt-24';

export default function DestinationPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const d = getDestination(slug);

  if (!d) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Seo
          title="Destination Not Found | Farirai Nandipa Events"
          description="The destination you're looking for isn't in the portfolio. Browse the African MICE destinations Farirai Nandipa Events has inspected."
          path={`/destinations/${slug}`}
        />
        <div className="text-center">
          <h1 className="font-['Cormorant_Garamond'] text-3xl text-[#21436A] mb-4">Destination Not Found</h1>
          <p className="font-['Inter'] text-[#3A3A3A] mb-6">
            The destination you're looking for isn't in the portfolio.
          </p>
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Destinations
          </Link>
        </div>
      </div>
    );
  }

  const access = [
    { label: t.accessLabels.flights, value: d.access.flights },
    { label: t.accessLabels.entry, value: d.access.entry },
    { label: t.accessLabels.transfers, value: d.access.transfers },
  ];

  return (
    <div className="font-['Inter'] text-ink">
      <Seo
        title={`${d.name} for Conferences, Congresses & Incentives | Farirai Nandipa Events`}
        description={d.headline}
        path={`/destinations/${d.slug}`}
      />

      {/* Breadcrumb + hero */}
      <section className="bg-white">
        <div className={`${container} pt-9 pb-16 lg:pb-20 flex flex-col gap-7`}>
          <nav aria-label="Breadcrumb">
            <ol className="flex gap-2 items-center text-sm text-ink-muted">
              <li>
                <Link to="/destinations" className="text-navy underline underline-offset-4 decoration-mint hover:text-navy-dark">
                  {t.breadcrumbRoot}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{d.name}</li>
            </ol>
          </nav>
          <div className="flex flex-wrap gap-14 items-center">
            <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-5">
              <div className="flex flex-wrap gap-3 items-center">
                <StatusBadge destination={d} />
                <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{d.cities}</span>
              </div>
              <h1 className="font-['Cormorant_Garamond'] font-semibold text-[clamp(52px,6.5vw,92px)] leading-[0.95] text-navy">
                {d.name}
              </h1>
              <p className="font-['Cormorant_Garamond'] italic font-medium text-[clamp(24px,2.4vw,32px)] leading-[1.25] text-navy max-w-[620px]">
                {d.headline}
              </p>
              <p className="text-lg leading-[1.7] max-w-[600px]">{d.intro}</p>
              <div className="flex flex-wrap gap-3 mt-1.5">
                <a href="#brief" className={btnPrimary}>{t.briefCta(d.name)}</a>
              </div>
            </div>
            <PhotoSlot
              photo={d.photos.hero}
              alt={`${d.name} venue`}
              className="flex-[1_1_440px] min-w-0 h-[280px] sm:h-[460px]"
            />
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section aria-label="Quick facts" className="bg-mint">
        <dl className={`${container} py-[30px] grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6`}>
          {d.facts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1.5">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-navy">{f.label}</dt>
              <dd className="font-['Cormorant_Garamond'] text-[22px] font-bold leading-[1.25] text-navy">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Why */}
      <section aria-labelledby="why-h" className={`${container} py-20 lg:py-[88px] flex flex-col gap-8`}>
        <SectionHeading id="why-h" eyebrow={t.whyEyebrow(d.name)} title={t.whyTitle} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
          {d.why.map((w, i) => (
            <article
              key={w.title}
              className="bg-white border border-gray-200 rounded-md p-[30px] flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <span aria-hidden="true" className="font-['Cormorant_Garamond'] font-semibold text-[46px] leading-none text-mint">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-['Cormorant_Garamond'] font-semibold text-[26px] text-navy">{w.title}</h3>
              <p className="text-base leading-[1.7]">{w.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Venue snapshot */}
      <section aria-labelledby="venue-h" className={`${container} py-20 lg:py-[88px] flex flex-col gap-6`}>
        <div className="flex flex-wrap justify-between items-end gap-4">
          <SectionHeading id="venue-h" eyebrow={t.venueEyebrow} title={t.venueTitle} />
          <span className="text-sm text-ink-muted">{t.venueNote}</span>
        </div>
        <div className="overflow-x-auto border border-gray-200 rounded-md bg-white" tabIndex={0} role="region" aria-labelledby="venue-h">
          <table className="w-full min-w-[860px] border-collapse text-[15px] leading-normal">
            <thead>
              <tr className="bg-navy text-white text-left">
                {['Venue', 'City', 'Type', 'Largest room', 'Breakouts', 'Rooms nearby'].map((h) => (
                  <th key={h} scope="col" className="px-[18px] py-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.venues.map((v) => (
                <tr key={v.name} className="border-t border-gray-200">
                  <th scope="row" className="px-[18px] py-4 text-left font-semibold text-navy">{v.name}</th>
                  <td className="px-[18px] py-4">{v.city}</td>
                  <td className="px-[18px] py-4">{v.type}</td>
                  <td className="px-[18px] py-4 text-ink-muted">{v.largestRoom}</td>
                  <td className="px-[18px] py-4 text-ink-muted">{v.breakouts}</td>
                  <td className="px-[18px] py-4 text-ink-muted">{v.roomsNearby}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Access */}
      <section aria-labelledby="access-h" className={`${container} pb-20 lg:pb-[88px] flex flex-col gap-6`}>
        <h2 id="access-h" className="font-['Cormorant_Garamond'] font-semibold text-[clamp(28px,2.6vw,36px)] text-navy">
          {t.accessTitle}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
          {access.map((a) => (
            <div
              key={a.label}
              className="bg-white border border-gray-200 border-t-[3px] border-t-mint rounded-b-md p-[22px] flex flex-col gap-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-navy">{a.label}</h3>
              <p className="text-base leading-[1.6]">{a.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Experiences */}
      <section aria-labelledby="exp-h" className="bg-navy text-white">
        <div className={`${container} py-20 lg:py-[88px] flex flex-col gap-8`}>
          <SectionHeading id="exp-h" eyebrow={t.experiencesEyebrow} title={t.experiencesTitle} onNavy />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5">
            {d.experiences.map((e) => (
              <article key={e.title} className="flex flex-col gap-3">
                <PhotoSlot photo={e.photo} alt={e.title} tone="navy" className="h-[170px]" />
                <h3 className="font-['Cormorant_Garamond'] font-semibold text-2xl">{e.title}</h3>
                <p className="text-[15px] leading-[1.6] text-white/85">{e.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Sample programme */}
      <section aria-labelledby="prog-h" className={`${container} py-20 lg:py-[88px] flex flex-col gap-7`}>
        <SectionHeading id="prog-h" eyebrow={t.programmeEyebrow} title={d.programmeTitle} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
          {d.programme.map((p) => (
            <article
              key={p.day}
              className="bg-white border border-gray-200 rounded-md p-7 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{p.day}</span>
              <h3 className="font-['Cormorant_Garamond'] font-semibold text-[26px] text-navy">{p.title}</h3>
              <ul className="flex flex-col gap-2.5">
                {p.items.map((it) => (
                  <li key={it} className="text-[15px] leading-normal pt-2.5 border-t border-gray-200">{it}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Bid Pipeline matches: hidden until there is real data */}
      {d.pipelineMatches.length > 0 && (
        <section aria-labelledby="bid-h" className={`${container} pb-20 lg:pb-[88px]`}>
          <div className="bg-mint-light rounded-md p-6 sm:p-9 flex flex-wrap gap-8 justify-between">
            <div className="flex-[1_1_340px] min-w-0 flex flex-col gap-2.5">
              <Eyebrow>{t.pipelineEyebrow}</Eyebrow>
              <h2 id="bid-h" className="font-['Cormorant_Garamond'] font-semibold text-[32px] leading-[1.1] text-navy">
                {t.pipelineTitle(d.name)}
              </h2>
              <p className="text-[15px] leading-[1.7]">{t.pipelineBody}</p>
            </div>
            <ul className="flex-[1.5_1_460px] min-w-0 flex flex-col bg-white rounded-md px-5 py-1">
              {d.pipelineMatches.map((b) => (
                <li
                  key={`${b.event}-${b.year}`}
                  className="flex flex-wrap justify-between gap-3 py-3.5 border-b border-gray-200 last:border-b-0 text-[15px]"
                >
                  <span className="font-semibold text-navy">{b.event}</span>
                  <span className="text-ink-muted">
                    {b.year} · {b.delegates} · Bid deadline {b.bidDeadline}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Brief CTA */}
      <section id="brief" aria-labelledby="cta-h" className={`bg-navy text-white ${anchorOffset}`}>
        <div className={`${container} py-[76px] flex flex-wrap gap-10 items-center justify-between`}>
          <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-3">
            <h2 id="cta-h" className="font-['Cormorant_Garamond'] font-semibold text-[clamp(34px,3.4vw,44px)] leading-[1.1]">
              {t.briefTitle(d.name)}
            </h2>
            <p className="text-[17px] leading-[1.7] text-white/85">{t.briefBody}</p>
          </div>
          <BriefForm destination={d} />
        </div>
      </section>
    </div>
  );
}

function BriefForm({ destination }: { destination: Destination }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'invalid' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPattern.test(email.trim())) {
      setStatus('invalid');
      return;
    }
    setStatus('submitting');
    try {
      await submitDestinationLead({
        source: 'destination-brief',
        email,
        details: [`Destination: ${destination.slug}`, `Requested: ${destination.name} Destination Brief`],
      });
      setStatus('success');
    } catch (error) {
      console.error('Destination brief request error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex-[1_1_420px] min-w-0">
        <GuideConfirmation title={t.briefSuccess} onNavy />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex-[1_1_420px] min-w-0 flex flex-wrap gap-3 items-end">
      <label className="flex-[1_1_240px] flex flex-col gap-1.5 text-sm font-medium">
        Work email (required)
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputOnNavyClass}
        />
      </label>
      <button type="submit" disabled={status === 'submitting'} className={`${btnOnNavy} disabled:opacity-50 disabled:cursor-not-allowed`}>
        {status === 'submitting' ? 'Sending...' : t.briefSubmit}
      </button>
      {(status === 'invalid' || status === 'error') && (
        <p role="alert" className="basis-full flex items-center gap-2 text-white bg-red-700/80 px-4 py-3 rounded text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {status === 'invalid'
            ? 'Please enter a valid work email and try again.'
            : 'Something went wrong sending your request. Please try again, or call +263 777 098 756.'}
        </p>
      )}
      <Link
        to="/destinations#services"
        className="basis-full text-mint text-[15px] underline underline-offset-4 hover:text-white focus-visible:outline-white"
      >
        {t.shortlistLink}
      </Link>
    </form>
  );
}
