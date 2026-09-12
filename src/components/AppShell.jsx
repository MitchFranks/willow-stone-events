// ---------------------------------------------------------------------------
// The frame that wraps every screen: product bar + breadcrumb trail.
//
// Keeping one shell around all three screens is what makes them read as the
// same product, and the breadcrumb is a persistent SIGNIFIER for "you are here
// / here is the way back".
// ---------------------------------------------------------------------------

import { Icon } from './ui.jsx'
import { venue } from '../data.js'

export function AppShell({ crumbs = [], onNavigate, children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__inner">
          <button className="brand" onClick={() => onNavigate('dashboard')} title="Back to venue dashboard">
            <span className="brand__mark" aria-hidden="true">
              W
            </span>
            <span className="brand__text">
              <span className="brand__name">{venue.name}</span>
              <span className="brand__sub">Venue Operations</span>
            </span>
          </button>

          <nav className="topnav" aria-label="Primary">
            <button
              className={`topnav__item ${crumbs.length === 0 ? 'is-active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
            <button className={`topnav__item ${crumbs.length > 0 ? 'is-active' : ''}`} disabled>
              Events
            </button>
            <button className="topnav__item" disabled>
              Calendar
            </button>
            <button className="topnav__item" disabled>
              Inbox
            </button>
          </nav>

          <div className="topbar__user">
            <span className="topbar__userText">
              <span className="topbar__userName">{venue.manager}</span>
              <span className="topbar__userRole">{venue.managerRole}</span>
            </span>
            <span className="avatar avatar--brand avatar--md">{venue.managerInitials}</span>
          </div>
        </div>
      </header>

      {crumbs.length > 0 && (
        <div className="crumbbar">
          <nav className="crumbbar__inner" aria-label="Breadcrumb">
            <button className="crumb crumb--link" onClick={() => onNavigate('dashboard')}>
              <Icon name="arrowLeft" size={14} />
              Dashboard
            </button>
            {crumbs.map((crumb, i) => (
              <span className="crumb__group" key={crumb.label}>
                <Icon name="chevronRight" size={13} className="crumb__sep" />
                {crumb.to && i < crumbs.length - 1 ? (
                  <button className="crumb crumb--link" onClick={() => onNavigate(crumb.to)}>
                    {crumb.label}
                  </button>
                ) : (
                  <span className="crumb crumb--current" aria-current="page">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}

      <main className="page">{children}</main>

      <footer className="footer">
        <span>
          Prototype · {venue.name} · IS 551. Mock data only — no live email, payments or integrations.
        </span>
      </footer>
    </div>
  )
}
