// ---------------------------------------------------------------------------
// SCREEN 1 — Venue dashboard.
// Job: in a few seconds, say what is happening at the venue and what needs the
// manager's attention.
//
// REVISION NOTE (progressive disclosure):
// The first version put four large stat tiles above the attention panel and
// showed every supporting card expanded. That gave five competing blocks at the
// same visual volume. Now the page leads with attention, the stats have shrunk
// into a compact "At a glance" rail, and recent activity starts collapsed —
// less on screen, same information one click away.
//
// Reading order, strongest signal first:
//   1. Needs Attention   (the answer to "what do I do next?")
//   2. Upcoming events   (the answer to "what is happening?")
//   3. Rail: glance / today / activity  (supporting context, quietest)
// ---------------------------------------------------------------------------

import { Card, Collapsible, Icon, Pill } from './ui.jsx'
import { VenueVignette } from './VenueArt.jsx'
import { events, recentActivity, todaySchedule, venue, venueStats } from '../data.js'

export function Dashboard({ attention, eventAttention, onOpenEvent, onOpenMessage }) {
  const open = attention.filter((item) => !item.resolved)
  const resolved = attention.filter((item) => item.resolved)
  const eventsWithAttention = new Set(open.map((item) => item.eventId)).size

  return (
    <div className="stack-lg">
      {/* Compact hero. The artwork sits inside the greeting row rather than
          above it, so it adds polish without pushing attention down the page. */}
      <section className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow">{venue.today}</p>
          <h1 className="hero__title">Good morning, {venue.manager.split(' ')[0]}</h1>
          <p className="hero__sub">
            One event on site today and {open.length} {open.length === 1 ? 'item' : 'items'} waiting on you
            across {eventsWithAttention} {eventsWithAttention === 1 ? 'event' : 'events'}.
          </p>
        </div>
        <div className="hero__aside">
          <Pill tone="live" icon="circle">
            Alvarez &amp; Reed on site
          </Pill>
        </div>
        <VenueVignette />
      </section>

      {/* ---------------------------------------------------------------
          NEEDS ATTENTION — the whole point of the screen, and now the
          single loudest element on it.
         --------------------------------------------------------------- */}
      <section className="attention attention--hero">
        <header className="attention__head">
          <div className="attention__headText">
            <h2 className="attention__title">
              <Icon name="alert" size={20} />
              Needs attention
            </h2>
            <p className="attention__sub">Sorted by what is due first. Everything else is on track.</p>
          </div>
          <span className="attention__count">
            {open.length} open
            {resolved.length > 0 && <span className="attention__countResolved">{resolved.length} resolved</span>}
          </span>
        </header>

        <ul className="attention__list">
          {open.map((item) => (
            <AttentionRow key={item.id} item={item} onOpenEvent={onOpenEvent} onOpenMessage={onOpenMessage} />
          ))}
          {resolved.map((item) => (
            <AttentionRow key={item.id} item={item} resolved onOpenEvent={onOpenEvent} onOpenMessage={onOpenMessage} />
          ))}
        </ul>
      </section>

      <div className="split">
        <div className="stack">
          <Card title="Upcoming events" icon="calendar" subtitle="Next five bookings">
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
          {/* The four stat tiles from v1, reduced to a quiet rail. Only the
              attention figure keeps its colour. */}
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

          <Card title="Today's schedule" icon="clock" subtitle="Saturday, September 12">
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
          </Card>

          {/* Starts closed: it is a log of things already handled, which is the
              opposite of what this screen is for. The badge keeps its existence
              visible. */}
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

function AttentionRow({ item, resolved, onOpenEvent, onOpenMessage }) {
  const isJohnson = item.eventId === 'johnson'
  const openTarget = item.id === 'decor-time' ? onOpenMessage : () => onOpenEvent('johnson')

  return (
    <li className={`arow ${resolved ? 'arow--resolved' : `arow--${item.tone}`}`}>
      <span className="arow__flag" aria-hidden="true" />

      <span className="arow__main">
        <span className="arow__topline">
          {resolved ? (
            <Pill tone="ok" icon="check">
              Resolved
            </Pill>
          ) : (
            <Pill tone={item.tone === 'urgent' ? 'urgent' : 'warning'}>{item.priority}</Pill>
          )}
          <button className="arow__event" onClick={() => isJohnson && onOpenEvent('johnson')} disabled={!isJohnson}>
            {item.event}
          </button>
        </span>
        <span className="arow__title">{item.title}</span>
        <span className="arow__detail">{resolved ? 'Reply sent to Emily Johnson. Timeline updated.' : item.detail}</span>
      </span>

      <span className="arow__action">
        {resolved ? (
          <button className="btn btn--quiet" onClick={openTarget}>
            View
          </button>
        ) : (
          // NO FALSE AFFORDANCE: only the flows that exist in this prototype
          // get an enabled button. The rest are visibly disabled instead of
          // looking clickable and doing nothing.
          <button
            className={`btn ${item.id === 'decor-time' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={openTarget}
            disabled={!isJohnson}
            title={isJohnson ? undefined : 'Only the Johnson Wedding is built out in this prototype'}
          >
            {item.action}
            <Icon name="arrowRight" size={14} />
          </button>
        )}
      </span>
    </li>
  )
}

function EventRow({ event, attention, onOpen }) {
  const clickable = event.clickable

  const content = (
    <>
      <span className="erow__date">
        <span className="erow__dateMain">{event.dateLabel}</span>
        <span className="erow__dateSub">{event.timeLabel}</span>
      </span>

      <span className="erow__main">
        <span className="erow__name">{event.name}</span>
        <span className="erow__clients">{event.clients}</span>
        <span className="erow__meta">
          <span className="erow__metaItem">
            <Icon name="users" size={13} /> {event.guests} guests
          </span>
          <span className="erow__metaItem">
            <Icon name="pin" size={13} /> {event.space}
          </span>
        </span>
      </span>

      <span className="erow__status">
        {attention > 0 ? (
          <Pill tone="urgent" icon="alert">
            {attention} need{attention === 1 ? 's' : ''} attention
          </Pill>
        ) : (
          <Pill tone="ok" icon="check">
            On track
          </Pill>
        )}
        <span className="erow__statusSub">
          {event.status} · {event.openTasks} open {event.openTasks === 1 ? 'task' : 'tasks'}
        </span>
      </span>

      {/* REVISION — SIGNIFIER: v1 relied on a pale chevron that only appeared
          to mean something on hover, so the way into the event was effectively
          invisible at rest. It is now a labelled button. */}
      <span className="erow__cta">
        {clickable ? (
          <span className="btn btn--primary btn--sm erow__ctaBtn">
            Open workspace
            <Icon name="arrowRight" size={13} />
          </span>
        ) : (
          <span className="erow__ctaEmpty" aria-hidden="true" />
        )}
      </span>
    </>
  )

  if (!clickable) {
    return <li className="erow erow--static">{content}</li>
  }

  return (
    <li>
      <button className="erow erow--button" onClick={() => onOpen(event.id)}>
        {content}
      </button>
    </li>
  )
}
