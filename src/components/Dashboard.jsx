// ---------------------------------------------------------------------------
// SCREEN 1 — Venue dashboard.
// Job: in a few seconds, say what is happening at the venue and what needs the
// manager's attention.
//
// Reading order is deliberate, strongest signal first:
//   1. Needs Attention   (the answer to "what do I do next?")
//   2. Upcoming events   (the answer to "what is happening?")
//   3. Today / activity  (supporting context, quietest)
// ---------------------------------------------------------------------------

import { Card, Icon, Pill } from './ui.jsx'
import { events, recentActivity, todaySchedule, venue, venueStats } from '../data.js'

export function Dashboard({ attention, eventAttention, onOpenEvent, onOpenMessage }) {
  const open = attention.filter((item) => !item.resolved)
  const resolved = attention.filter((item) => item.resolved)
  const eventsWithAttention = new Set(open.map((item) => item.eventId)).size

  return (
    <div className="stack-lg">
      <div className="pagehead">
        <div>
          <p className="pagehead__eyebrow">{venue.today}</p>
          <h1 className="pagehead__title">Good morning, {venue.manager.split(' ')[0]}</h1>
          <p className="pagehead__sub">
            One event on site today and {open.length} {open.length === 1 ? 'item' : 'items'} waiting on you
            across {eventsWithAttention} {eventsWithAttention === 1 ? 'event' : 'events'}.
          </p>
        </div>
        <div className="pagehead__aside">
          <Pill tone="live" icon="circle">
            Alvarez &amp; Reed on site
          </Pill>
        </div>
      </div>

      {/* SIMILARITY: four stats share one shape; only the attention stat is
          tinted, so the eye lands on the number that implies work. */}
      <div className="statrow">
        {venueStats.map((stat) => (
          <Stat
            key={stat.label}
            label={stat.label}
            tone={stat.tone}
            // The attention tile is derived from live state so it can never
            // disagree with the list directly beneath it.
            value={stat.tone === 'attention' ? String(open.length) : stat.value}
            note={stat.tone === 'attention' ? `across ${eventsWithAttention} events` : stat.note}
          />
        ))}
      </div>

      {/* ---------------------------------------------------------------
          NEEDS ATTENTION — the whole point of the screen.
          Given its own tinted common region, placed above everything else,
          and the only place on the page that uses the attention colours.
         --------------------------------------------------------------- */}
      <section className="attention">
        <header className="attention__head">
          <div className="attention__headText">
            <h2 className="attention__title">
              <Icon name="alert" size={18} />
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
          <Card
            title="Upcoming events"
            icon="calendar"
            subtitle="Next five bookings"
            action={<span className="card__hint">Johnson Wedding opens a full workspace</span>}
          >
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

          <Card title="Recent activity" icon="clock" subtitle="Across all events">
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
          </Card>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, note, tone }) {
  return (
    <div className={`stat ${tone ? `stat--${tone}` : ''}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      <span className="stat__note">{note}</span>
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

      {/* SIGNIFIER: the chevron appears only on the row that actually opens. */}
      {clickable && <Icon name="chevronRight" size={18} className="erow__chev" />}
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
