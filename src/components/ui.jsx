// ---------------------------------------------------------------------------
// Small shared UI pieces used by all three screens.
//
// SIMILARITY (Gestalt): these are the only building blocks the screens use, so
// anything with the same job looks the same everywhere in the product.
// GALL'S LAW: deliberately a tiny set of primitives — a simple system that
// works, which can grow later, rather than a design system built up front.
// ---------------------------------------------------------------------------

const PATHS = {
  alert: (
    <>
      <path d="M12 3.8 2.9 19.4h18.2L12 3.8Z" />
      <path d="M12 9.6v4" />
      <path d="M12 16.6h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 1.9" />
    </>
  ),
  users: (
    <>
      <path d="M16 20v-1.6a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
      <circle cx="9" cy="7.5" r="3.5" />
      <path d="M17 4.2a3.5 3.5 0 0 1 0 6.6M22 20v-1.6a4 4 0 0 0-3-3.8" />
    </>
  ),
  dollar: (
    <>
      <path d="M12 2.8v18.4" />
      <path d="M16.5 6.7H9.9a2.9 2.9 0 0 0 0 5.8h4.2a2.9 2.9 0 0 1 0 5.8H7" />
    </>
  ),
  check: (
    <>
      <path d="m4.5 12.5 5 5L19.5 7" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.7 2.7L16.2 9.4" />
    </>
  ),
  circle: (
    <>
      <circle cx="12" cy="12" r="8.2" />
    </>
  ),
  mail: (
    <>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2" />
      <path d="m3.4 6.5 8.6 6.2 8.6-6.2" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5" />
    </>
  ),
  chevronRight: <path d="m9.5 5.5 7 6.5-7 6.5" />,
  arrowLeft: (
    <>
      <path d="M19 12H5.5" />
      <path d="m11 5.5-5.5 6.5 5.5 6.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h13.5" />
      <path d="m13 5.5 5.5 6.5-5.5 6.5" />
    </>
  ),
  send: (
    <>
      <path d="M21.5 2.5 10.8 13.2" />
      <path d="M21.5 2.5 14.8 21.5l-4-8.3-8.3-4 19-6.7Z" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6l-1.9-5.8L4.3 10.9 10.1 9 12 3.2Z" />
      <path d="M19 3v3.4M20.7 4.7h-3.4" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 1 0-5.7-5.7l-1.3 1.3" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3" />
    </>
  )
}

export function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

// A bordered region. COMMON REGION + PROXIMITY: one card = one subject, so
// related facts sit together inside a shared boundary.
export function Card({ title, icon, subtitle, action, tone = '', children, className = '' }) {
  return (
    <section className={`card ${tone ? `card--${tone}` : ''} ${className}`}>
      {(title || action) && (
        <header className="card__head">
          <div className="card__headText">
            <h2 className="card__title">
              {icon && <Icon name={icon} size={15} />}
              {title}
            </h2>
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  )
}

// Status labels. One tone per meaning, used identically on all three screens,
// so a colour never means two different things (NO INTERFERENCE).
export function Pill({ tone = 'neutral', icon, children }) {
  return (
    <span className={`pill pill--${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}

export function Avatar({ initials, tone = 'neutral', size = 'md' }) {
  return <span className={`avatar avatar--${tone} avatar--${size}`}>{initials}</span>
}

// A labelled value. Used for every "field" in the product.
export function Field({ label, value, children }) {
  return (
    <div className="field">
      <dt className="field__label">{label}</dt>
      <dd className="field__value">{children || value}</dd>
    </div>
  )
}
