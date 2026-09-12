// ---------------------------------------------------------------------------
// SCREEN 1 — Venue dashboard.
// Job: in a few seconds, say what is happening at the venue and what needs the
// manager's attention — without making that feel like being shouted at.
//
// REVISION NOTE (second pass — welcome, then disclose):
// The page used to open with five fully-written attention items and five dense
// event rows. Everything was legible but it arrived all at once, which reads as
// pressure rather than control.
//
// Now the page opens on a photographic welcome band that states the one number
// that matters, and both lists below it are single lines that open on click.
// The closed state still carries enough to triage — status, title, which event
// — so opening a row is for acting, not for finding out what it is.
// ---------------------------------------------------------------------------

import { useRef, useState } from 'react'
import { Card, Collapsible, DisclosureRow, Icon, Pill } from './ui.jsx'
import heroImage from '../assets/hero-reception.jpg'
import { events, recentActivity, todaySchedule, venue, venueStats } from '../data.js'

export function Dashboard({ attention, eventAttention, onOpenEvent, onOpenMessage }) {
  const attentionRef = useRef(null)
  const open = attention.filter((item) => !item.resolved)
  const resolved = attention.filter((item) => item.resolved)
  const eventsWithAttention = new Set(open.map((item) => item.eventId)).size

  return (
    <div className="stack-lg">
      {/* ------------------------- WELCOME BAND -------------------------- */}
      <section className="phero">
        <img className="phero__img" src={heroImage} alt="" />
        <div className="phero__scrim" aria-hidden="true" />
        <div className="phero__content">
          <p className="phero__eyebrow">{venue.today}</p>
          <h1 className="phero__title">Good morning, {venue.manager.split(' ')[0]}</h1>
          <p className="phero__lead">
            One event is on site today, and{' '}
            <strong>
              {open.length} {open.length === 1 ? 'item needs' : 'items need'} your attention
            </strong>{' '}
            across {eventsWithAttention} {eventsWithAttention === 1 ? 'event' : 'events'}.
          </p>
          <div className="phero__actions">
            <button
              className="btn btn--onDark"
              onClick={() => attentionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              See what needs attention
              <Icon name="arrowRight" size={15} />
            </button>
            <Pill tone="onDark" icon="circle">
              Alvarez &amp; Reed on site
            </Pill>
          </div>
        </div>
      </section>

      {/* ---------------------- NEEDS ATTENTION -------------------------- */}
      <section className="attention attention--hero" ref={attentionRef}>
        <header className="attention__head">
          <div className="attention__headText">
            <h2 className="attention__title">
              <Icon name="alert" size={20} />
              Needs attention
            </h2>
            <p className="attention__sub">Sorted by what is due first. Open a row to act on it.</p>
          </div>
          <span className="attention__count">
            {open.length} open
            {resolved.length > 0 && <span className="attention__countResolved">{resolved.length} resolved</span>}
          </span>
        </header>

        <ul className="attention__list">
          {open.map((item, i) => (
            <AttentionRow
              key={item.id}
              item={item}
              defaultOpen={i === 0}
              onOpenEvent={onOpenEvent}
              onOpenMessage={onOpenMessage}
            />
          ))}
          {resolved.map((item) => (
            <AttentionRow key={item.id} item={item} resolved onOpenEvent={onOpenEvent} onOpenMessage={onOpenMessage} />
          ))}
        </ul>
      </section>

      <div className="split">
        <div className="stack">
          <Card title="Upcoming events" icon="calendar" subtitle="Next five bookings · open a row for detail">
            <ul className="eventlist">
              {events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  attention={eventAttention[event.id] ?? event.attention}
                  onOpen={onOpenEvent}
                />
              ))}
            </ul>
          </Card>
        </div>

        <div className="stack">
          <Card title="At a glance" icon="circle" subtitle="This month">
            <ul className="glance">
              {venueStats.map((stat) => {
                const isAttention = stat.tone === 'attention'
                return (
                  <li className={`glance__row ${isAttention ? 'glance__row--attention' : ''}`} key={stat.label}>
                    <span className="glance__label">{stat.label}</span>
                    <span className="glance__value">
                      {isAttention ? open.length : stat.value}
                      <span className="glance__note">
                        {isAttention ? `across ${eventsWithAttention} events` : stat.note}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Collapsible title="Today's schedule" icon="clock" badge={`${todaySchedule.length} items`} defaultOpen>
            <ol className="daylist">
              {todaySchedule.map((slot) => (
                <li key={slot.time} className={`daylist__item daylist__item--${slot.state}`}>
                  <span className="daylist__time">{slot.time}</span>
                  <span className="daylist__marker" aria-hidden="true" />
                  <span className="daylist__text">
                    <span className="daylist__title">{slot.title}</span>
                    <span className="daylist__detail">{slot.detail}</span>
                  </span>
                  {slot.state === 'now' && <Pill tone="live">Now</Pill>}
                </li>
              ))}
            </ol>
          </Collapsible>

          <Collapsible title="Recent activity" icon="clock" badge={`${recentActivity.length} updates`}>
            <ul className="activity">
              {recentActivity.map((entry, i) => (
                <li className="activity__item" key={i}>
                  <span className={`activity__icon ${entry.unread ? 'is-unread' : ''}`}>
                    <Icon name={entry.icon} size={14} />
                  </span>
                  <span className="activity__text">
                    <span className="activity__line">{entry.text}</span>
                    <span className="activity__meta">
                      {entry.event} · {entry.when}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}

function AttentionRow({ item, resolved, defaultOpen, onOpenEvent, onOpenMessage }) {
  const isJohnson = item.eventId === 'johnson'
  const openTarget = item.id === 'decor-time' ? onOpenMessage : () => onOpenEvent('johnson')

  const summary = (
    <>
      <span className="aitem__flag" aria-hidden="true" />
      {resolved ? (
        <Pill tone="ok" icon="check">
          Resolved
        </Pill>
      ) : (
        <Pill tone={item.tone === 'urgent' ? 'urgent' : 'warning'}>{item.priority}</Pill>
      )}
      <span className="aitem__title">{item.title}</span>
      <span className="aitem__event">{item.event}</span>
    </>
  )

  return (
    <DisclosureRow
      className={resolved ? 'aitem aitem--resolved' : `aitem aitem--${item.tone}`}
      summary={summary}
      defaultOpen={defaultOpen}
    >
      <p className="aitem__detail">{resolved ? 'Reply sent to Emily Johnson. Timeline updated.' : item.detail}</p>
      <p className="aitem__meta">{item.meta}</p>
      <div className="aitem__actions">
        {resolved ? (
          <button className="btn btn--secondary btn--sm" onClick={openTarget}>
            View sent reply
          </button>
        ) : (
          // NO FALSE AFFORDANCE: only flows that exist in this prototype get an
          // enabled button; the rest are visibly disabled and say why.
          <button
            className={`btn ${item.id === 'decor-time' ? 'btn--primary' : 'btn--secondary'} btn--sm`}
            onClick={openTarget}
            disabled={!isJohnson}
            title={isJohnson ? undefined : 'Only the Johnson Wedding is built out in this prototype'}
          >
            {item.action}
            <Icon name="arrowRight" size={13} />
          </button>
        )}
      </div>
    </DisclosureRow>
  )
}

// Two sibling controls rather than one: the row body expands for detail, and
// the button navigates. Nesting a button inside a button is invalid HTML and
// makes the target ambiguous anyway.
function EventRow({ event, attention, onOpen }) {
  const [open, setOpen] = useState(false)

  return (
    <li className={`erow2 ${open ? 'is-open' : ''} ${event.clickable ? 'erow2--live' : ''}`}>
      <div className="erow2__line">
        <button className="erow2__expand" onClick={() => setOpen(!open)} aria-expanded={open}>
          <Icon name="chevronRight" size={15} className="erow2__chev" />
          <span className="erow2__date">
            <span className="erow2__dateMain">{event.dateLabel}</span>
            <span className="erow2__dateSub">{event.timeLabel}</span>
          </span>
          <span className="erow2__name">
            {event.name}
            <span className="erow2__clients">{event.clients}</span>
          </span>
          {attention > 0 ? (
            <Pill tone="urgent" icon="alert">
              {attention}
            </Pill>
          ) : (
            <Pill tone="ok" icon="check">
              On track
            </Pill>
          )}
        </button>

        {event.clickable && (
          <button className="btn btn--primary btn--sm erow2__cta" onClick={() => onOpen(event.id)}>
            Open workspace
            <Icon name="arrowRight" size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="erow2__detail">
          <dl className="minifacts">
            <div>
              <dt>Guests</dt>
              <dd>{event.guests}</dd>
            </div>
            <div>
              <dt>Spaces</dt>
              <dd>{event.space}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{event.status}</dd>
            </div>
            <div>
              <dt>Open tasks</dt>
              <dd>{event.openTasks}</dd>
            </div>
          </dl>
          {!event.clickable && (
            <p className="erow2__note">Only the Johnson Wedding is built out in this prototype.</p>
          )}
        </div>
      )}
    </li>
  )
}
