import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import Seo from '../components/Seo';
import {
  EVENT_TYPE_LABELS,
  destinations,
  hub,
  type EventType,
} from '../data/destinations';
import {
  Eyebrow,
  GuideConfirmation,
  PhotoSlot,
  SectionHeading,
  btnOnNavy,
  btnPrimary,
  btnSecondary,
  container,
  inputClass,
} from '../components/destinations/shared';
import { emailPattern, submitDestinationLead } from '../components/destinations/leads';

type Filter = 'all' | EventType;

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: hub.portfolio.allLabel },
  ...(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((id) => ({ id, label: EVENT_TYPE_LABELS[id] })),
];

// Links inside the page (#brief, #compare) and in from other pages
// (/destinations#services) need to clear the fixed 80px header.
const anchorOffset = 'scroll-mt-24';

export default function Destinations() {
  const [filter, setFilter] = useState<Filter>('all');
  const location = useLocation();

  // ScrollToTop resets to the top on route change, so honour a hash
  // (e.g. /destinations#services from a destination page) after it runs.
  useEffect(() => {
    if (!location.hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }, 50);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  const visible = destinations.filter((d) => filter === 'all' || d.eventTypes.includes(filter));

  return (
    <div className="font-['Inter'] text-ink">
      <Seo
        title="African MICE Destinations | Farirai Nandipa Events"
        description={hub.intro}
        path="/destinations"
      />

      {/* Hero */}
      <section className="bg-white">
        <div className={`${container} py-16 lg:pt-[88px] lg:pb-24 flex flex-wrap gap-14 items-center`}>
          <div className="flex-[1_1_520px] min-w-0 flex flex-col gap-[22px]">
            <Eyebrow>{hub.eyebrow}</Eyebrow>
            <h1 className="font-['Cormorant_Garamond'] font-semibold text-[clamp(42px,5vw,66px)] leading-[1.05] text-navy">
              {hub.title}
            </h1>
            <p className="text-lg leading-[1.7] max-w-[580px]">{hub.intro}</p>
            <div className="flex flex-wrap gap-3 mt-1.5">
              <a href="#brief" className={btnPrimary}>{hub.primaryCta}</a>
              <a href="#compare" className={btnSecondary}>{hub.secondaryCta}</a>
            </div>
          </div>
          <div className="flex-[1_1_440px] min-w-0 grid grid-cols-2 gap-3">
            <PhotoSlot photo={hub.heroPhotos.main} alt="Farirai Nandipa on a venue walk-through" className="col-span-2 h-[220px] sm:h-[280px]" />
            <PhotoSlot photo={hub.heroPhotos.left} alt="Plenary hall" className="h-[140px] sm:h-[170px]" />
            <PhotoSlot photo={hub.heroPhotos.right} alt="Incentive experience" className="h-[140px] sm:h-[170px]" />
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section aria-label="Credentials" className="bg-mint">
        <div className={`${container} py-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6`}>
          {hub.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="font-['Cormorant_Garamond'] text-[34px] font-bold text-navy">{s.value}</span>
              <span className="text-sm text-navy">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Destination grid + filter */}
      <section aria-labelledby="dest-h" className={`${container} pt-20 lg:pt-[88px] pb-10 flex flex-col gap-8`}>
        <div className="flex flex-wrap justify-between items-end gap-6">
          <SectionHeading id="dest-h" eyebrow={hub.portfolio.eyebrow} title={hub.portfolio.title} body={hub.portfolio.body} />
          <div role="group" aria-label="Filter destinations by event type" className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={`min-h-[44px] px-4 py-2.5 rounded border text-sm font-medium transition-colors duration-200 focus-visible:outline-navy ${
                    active
                      ? 'bg-navy border-navy text-white'
                      : 'bg-white border-[#C7CDD4] text-navy hover:border-navy'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {visible.length} {visible.length === 1 ? 'destination' : 'destinations'} shown
        </p>

        {visible.length === 0 ? (
          <p className="text-base text-ink-muted">{hub.portfolio.emptyLabel}</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-6">
            {visible.map((d) => (
              <li key={d.slug} className="flex">
                <Link
                  to={`/destinations/${d.slug}`}
                  className="group flex flex-col w-full bg-white border border-gray-200 rounded-md overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow duration-200 focus-visible:outline-navy"
                >
                  <PhotoSlot photo={d.photos.card} alt={d.name} className="h-[210px]" square />
                  <div className="px-6 pt-[22px] pb-[26px] flex flex-col gap-2.5 flex-grow">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{d.cities}</span>
                    <h3 className="font-['Cormorant_Garamond'] font-semibold text-[34px] leading-none text-navy">{d.name}</h3>
                    <p className="text-base leading-[1.6]">{d.bestFor}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {d.eventTypes.map((t) => (
                        <span key={t} className="text-xs font-medium text-navy bg-mint-light px-2.5 py-1 rounded">
                          {EVENT_TYPE_LABELS[t]}
                        </span>
                      ))}
                    </div>
                    <span className="mt-auto pt-3 flex items-center gap-2 font-medium text-[15px] text-navy group-hover:text-navy-dark">
                      Explore {d.name}
                      <ArrowRight className="w-[18px] h-[18px] transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comparison table */}
      <section id="compare" aria-labelledby="cmp-h" className={`${container} ${anchorOffset} py-16 flex flex-col gap-6`}>
        <SectionHeading
          id="cmp-h"
          eyebrow={hub.compare.eyebrow}
          title={hub.compare.title}
          body={`${hub.compare.body} Updated ${hub.comparisonUpdated}.`}
        />
        <div className="overflow-x-auto border border-gray-200 rounded-md bg-white" tabIndex={0} role="region" aria-labelledby="cmp-h">
          <table className="w-full min-w-[980px] border-collapse text-[15px] leading-normal">
            <thead>
              <tr className="bg-navy text-white text-left">
                {['Destination', 'Flagship venue', 'Largest plenary', 'Main airports', 'Best months', 'Best for', 'Signature add-on'].map((h) => (
                  <th key={h} scope="col" className="px-[18px] py-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => (
                <tr key={d.slug} className="border-t border-gray-200">
                  <th scope="row" className="px-[18px] py-4 text-left">
                    <Link
                      to={`/destinations/${d.slug}`}
                      className="font-['Cormorant_Garamond'] text-xl font-bold text-navy underline underline-offset-4 decoration-mint hover:text-navy-dark"
                    >
                      {d.name}
                    </Link>
                  </th>
                  <td className="px-[18px] py-4">{d.comparison.flagshipVenue}</td>
                  <td className="px-[18px] py-4 text-ink-muted">{d.comparison.largestPlenary}</td>
                  <td className="px-[18px] py-4">{d.comparison.airports}</td>
                  <td className="px-[18px] py-4">{d.comparison.bestMonths}</td>
                  <td className="px-[18px] py-4">{d.comparison.bestFor}</td>
                  <td className="px-[18px] py-4">{d.comparison.signatureAddOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Signature combinations */}
      <section aria-labelledby="iti-h" className="bg-mint-light">
        <div className={`${container} py-20 flex flex-col gap-8`}>
          <SectionHeading id="iti-h" eyebrow={hub.combos.eyebrow} title={hub.combos.title} body={hub.combos.body} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
            {hub.signatureCombos.map((c) => (
              <article key={c.title} className="bg-white rounded-md p-[30px] flex flex-col gap-3.5">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{c.countries}</span>
                <h3 className="font-['Cormorant_Garamond'] font-semibold text-[28px] leading-[1.15] text-navy">{c.title}</h3>
                <p className="text-base leading-[1.7]">{c.body}</p>
                <span className="mt-auto text-sm text-ink-muted pt-3 border-t border-gray-200">{c.meta}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" aria-labelledby="svc-h" className={`${container} ${anchorOffset} py-20 lg:py-[88px] flex flex-col gap-8`}>
        <SectionHeading id="svc-h" eyebrow={hub.servicesIntro.eyebrow} title={hub.servicesIntro.title} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-6">
          {hub.services.map((s) => (
            <article
              key={s.title}
              className={`bg-white rounded-md p-8 flex flex-col gap-3.5 ${
                s.featured ? 'border-2 border-navy' : 'border border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center gap-3">
                <span className="text-sm font-medium text-ink-muted">{s.price}</span>
                {s.featured && (
                  <span className="text-xs font-semibold bg-mint text-navy px-2.5 py-1 rounded">
                    {hub.servicesIntro.featuredTag}
                  </span>
                )}
              </div>
              <h3 className="font-['Cormorant_Garamond'] font-semibold text-[28px] text-navy">{s.title}</h3>
              <p className="text-base leading-[1.7]">{s.body}</p>
              <a href="#brief" className={`${s.featured ? btnPrimary : btnSecondary} mt-auto self-start`}>
                {s.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Bid Pipeline */}
      <section id="pipeline" aria-labelledby="pipe-h" className="bg-navy text-white">
        <div className={`${container} py-[72px] flex flex-wrap gap-10 items-center justify-between`}>
          <div className="flex-[1_1_520px] min-w-0">
            <SectionHeading id="pipe-h" eyebrow={hub.pipeline.eyebrow} title={hub.pipeline.title} onNavy />
            <p className="mt-3.5 text-[17px] leading-[1.7] text-white/85 max-w-[680px]">{hub.pipeline.body}</p>
          </div>
          {/* Standalone dashboard served outside the SPA, so use a plain anchor for a full page load */}
          <a href={hub.pipeline.ctaHref} className={btnOnNavy}>{hub.pipeline.ctaLabel}</a>
        </div>
      </section>

      {/* Enquiry */}
      <section id="brief" aria-labelledby="brief-h" className={`${container} ${anchorOffset} py-20 lg:py-[88px] flex flex-wrap gap-14`}>
        <div className="flex-[1_1_380px] min-w-0 flex flex-col gap-4">
          <SectionHeading id="brief-h" eyebrow={hub.enquiry.eyebrow} title={hub.enquiry.title} body={hub.enquiry.body} />
          <div className="mt-3 p-[22px] bg-mint-light rounded-md flex flex-col gap-1.5">
            <span className="font-semibold text-navy">{hub.enquiry.talkFirst}</span>
            <span className="text-[15px]">{hub.enquiry.contactLine}</span>
          </div>
        </div>
        <EnquiryForm />
      </section>
    </div>
  );
}

const labelClass = 'flex flex-col gap-1.5 text-sm font-medium text-navy';

function EnquiryForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'invalid' | 'error'>('idle');
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (value: string) =>
    setInterests((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? '').trim();
    const email = get('email');
    if (!emailPattern.test(email)) {
      setStatus('invalid');
      return;
    }
    setStatus('submitting');
    try {
      await submitDestinationLead({
        source: 'destinations-hub',
        email,
        name: get('name'),
        details: [
          `Organisation: ${get('organisation') || '-'}`,
          `Event type: ${get('eventType') || '-'}`,
          `Expected delegates: ${get('delegates') || '-'}`,
          `Preferred dates: ${get('dates') || '-'}`,
          `Destinations of interest: ${interests.length ? interests.join(', ') : '-'}`,
          '',
          'What success looks like:',
          get('goal') || '-',
        ],
      });
      setStatus('success');
    } catch (error) {
      console.error('Destinations enquiry error:', error);
      setStatus('error');
    }
  };

  const shell = 'flex-[1_1_560px] min-w-0 bg-white border border-gray-200 rounded-md p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]';

  if (status === 'success') {
    return (
      <div className={shell}>
        <GuideConfirmation title={hub.enquiry.successTitle} body={hub.enquiry.successBody} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={`${shell} grid grid-cols-1 sm:grid-cols-2 gap-[18px]`}>
      <label className={labelClass}>
        Full name
        <input type="text" name="name" autoComplete="name" className={inputClass} />
      </label>
      <label className={labelClass}>
        Organisation
        <input type="text" name="organisation" autoComplete="organization" className={inputClass} />
      </label>
      <label className={labelClass}>
        Work email (required)
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className={labelClass}>
        Event type
        <select name="eventType" className={inputClass} defaultValue="">
          <option value="">Select</option>
          {hub.enquiry.eventTypeOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Expected delegates
        <select name="delegates" className={inputClass} defaultValue="">
          <option value="">Select</option>
          {hub.enquiry.delegateOptions.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Preferred dates
        <input type="text" name="dates" placeholder={hub.enquiry.datesPlaceholder} className={inputClass} />
      </label>
      <fieldset className="sm:col-span-2 flex flex-wrap gap-x-5 gap-y-1.5">
        <legend className="text-sm font-medium text-navy mb-2">Destinations of interest</legend>
        {[...destinations.map((d) => d.name), hub.enquiry.notSureLabel].map((name) => (
          <label key={name} className="flex items-center gap-2 text-[15px] min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={interests.includes(name)}
              onChange={() => toggleInterest(name)}
              className="w-[18px] h-[18px] accent-navy"
            />
            {name}
          </label>
        ))}
      </fieldset>
      <label className={`${labelClass} sm:col-span-2`}>
        What does success look like for this event?
        <textarea name="goal" rows={3} className={`${inputClass} resize-y`} />
      </label>

      {(status === 'invalid' || status === 'error') && (
        <p role="alert" className="sm:col-span-2 flex items-center gap-2 text-red-700 bg-red-50 px-4 py-3 rounded text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          {status === 'invalid'
            ? 'Please enter a valid work email and try again.'
            : 'Something went wrong sending your enquiry. Please try again, or call +263 777 098 756.'}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`${btnPrimary} sm:col-span-2 justify-self-start disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {status === 'submitting' ? 'Sending...' : hub.enquiry.submitLabel}
      </button>
    </form>
  );
}
