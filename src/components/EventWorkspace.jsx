// ---------------------------------------------------------------------------
// SCREEN 2 — Johnson Wedding workspace.
// Job: the entire status of one event, without opening anything else.
//
// GROUPING: the page is four bands, not a wall of widgets —
//   1. Identity      (what this event is)
//   2. Needs attention (what is unresolved, tinted, above the fold)
//   3. Running the day (timeline, tasks, vendors, staff)   — left column
//   4. Commercial / people (client, money, documents, comms) — right column
// ---------------------------------------------------------------------------

import { Avatar, Card, Field, Icon, Pill } from './ui.jsx'
import { johnson } from '../data.js'

export function EventWorkspace({ attention, replySent, onBack, onOpenMessage }) {
  const open = attention.filter((item) => !item.resolved)
  const resolved = attention.filter((item) => item.resolved)
  const e = johnson

  return (
    <div className="stack-lg">
      <div className="pagehead pagehead--event">
        <div>
          <button className="backlink" onClick={onBack}>
            <Icon name="arrowLeft" size={15} />
            All events
          </button>
          <h1 className="pagehead__title">{e.name}</h1>
          <p className="pagehead__sub">
            {e.clients ?? 'Emily & Marcus Johnson'} · {e.package}
          </p>
        </div>
        <div className="pagehead__aside">
          {open.length > 0 ? (
            <Pill tone="urgent" icon="alert">
              {open.length} need{open.length === 1 ? 's' : ''} attention
            </Pill>
          ) : (
            <Pill tone="ok" icon="check">
              All clear
            </Pill>
          )}
        </div>
      </div>

      {/* Identity band — the four facts the manager is asked for constantly. */}
      <section className="factbar">
        <Fact icon="calendar" label="Date" value={e.date} note={e.countdown} />
        <Fact icon="clock" label="Ceremony" value={e.ceremony} note="Guest arrival 3:30 PM" />
        <Fact icon="users" label="Guest count" value={`${e.guests} confirmed`} note="Final count due Sep 14" />
        <Fact icon="pin" label="Spaces" value="Garden Terrace" note="Reception in Stone Hall" />
      </section>

      {/* Attention band — same colour language as the dashboard. */}
      <section className="attention attention--event">
        <header className="attention__head">
          <div className="attention__headText">
            <h2 className="attention__title">
              <Icon name="alert" size={18} />
              Needs your attention
            </h2>
            <p className="attention__sub">Three things stand between this event and ready.</p>
          </div>
          <span className="attention__count">
            {open.length} open
            {resolved.length > 0 && <span className="attention__countResolved">{resolved.length} resolved</span>}
          </span>
        </header>

        <div className="attcards">
          {attention.map((item) => (
            <article key={item.id} className={`attcard ${item.resolved ? 'attcard--resolved' : `attcard--${item.tone}`}`}>
              <header className="attcard__head">
                {item.resolved ? (
                  <Pill tone="ok" icon="check">
                    Resolved
                  </Pill>
                ) : (
                  <Pill tone={item.tone === 'urgent' ? 'urgent' : 'warning'}>{item.priority}</Pill>
                )}
              </header>
              <h3 className="attcard__title">{item.title}</h3>
              <p className="attcard__detail">
                {item.resolved ? 'Reply sent to Emily Johnson and the timeline has been updated.' : item.detail}
              </p>
              <footer className="attcard__foot">
                {item.id === 'decor-time' ? (
                  <button className={`btn ${item.resolved ? 'btn--quiet' : 'btn--primary'}`} onClick={onOpenMessage}>
                    <Icon name="mail" size={14} />
                    {item.resolved ? 'View sent reply' : 'Open message & reply'}
                  </button>
                ) : (
                  <span className="attcard__meta">{item.meta}</span>
                )}
              </footer>
            </article>
          ))}
        </div>
      </section>

      <div className="split split--event">
        {/* ------------------------- RUNNING THE DAY ------------------------ */}
        <div className="stack">
          <Card
            title="Day-of timeline"
            icon="clock"
            subtitle="Saturday, September 19, 2026"
            action={<span className="card__hint">{replySent ? 'Updated just now' : 'Draft v2 · awaiting client sign-off'}</span>}
          >
            <ol className="timeline">
              {e.timeline.map((slot) => {
                const flagged = slot.flagged && !replySent
                return (
                  <li key={slot.time} className={`timeline__item ${flagged ? 'timeline__item--flagged' : ''}`}>
                    <span className="timeline__time">{slot.time}</span>
                    <span className="timeline__rail" aria-hidden="true">
                      <span className="timeline__dot" />
                    </span>
                    <span className="timeline__body">
                      <span className="timeline__title">
                        {slot.title}
                        {flagged && <Pill tone="urgent">Change requested</Pill>}
                        {slot.flagged && replySent && <Pill tone="ok" icon="check">Confirmed 9:00 AM</Pill>}
                      </span>
                      <span className="timeline__detail">
                        {slot.flagged && replySent
                          ? 'Moved from 10:00 AM at the client’s request. Vendors notified.'
                          : slot.detail}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card
            title="Tasks"
            icon="check"
            subtitle={`${e.tasks.filter((t) => t.open && !(replySent && t.id === 'decor-time')).length} open · ${
              e.tasks.filter((t) => !t.open).length + (replySent ? 1 : 0)
            } complete`}
          >
            <ul className="tasks">
              {e.tasks.map((task) => {
                const done = !task.open || (replySent && task.id === 'decor-time')
                return (
                  <li key={task.id} className={`task ${done ? 'task--done' : ''} ${task.flagged && !done ? 'task--flagged' : ''}`}>
                    <span className="task__box" aria-hidden="true">
                      {done && <Icon name="check" size={12} />}
                    </span>
                    <span className="task__label">{task.label}</span>
                    <span className="task__due">{done && task.open ? 'Completed just now' : task.due}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <div className="split-2">
            <Card title="Vendors" icon="link" subtitle={`${e.vendors.length} booked`}>
              <ul className="rows">
                {e.vendors.map((v) => (
                  <li className="row" key={v.name}>
                    <span className="row__main">
                      <span className="row__title">{v.name}</span>
                      <span className="row__sub">
                        {v.role} · {v.contact}
                      </span>
                      <span className="row__note">{v.note}</span>
                    </span>
                    <Pill tone={v.tone === 'attention' ? 'warning' : 'ok'} icon={v.tone === 'attention' ? 'alert' : 'check'}>
                      {v.state}
                    </Pill>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Staff" icon="users" subtitle="8 scheduled · published Sep 8">
              <ul className="rows">
                {e.staff.map((s) => (
                  <li className="row row--tight" key={s.name}>
                    <Avatar initials={s.initials} size="sm" />
                    <span className="row__main">
                      <span className="row__title">{s.name}</span>
                      <span className="row__sub">{s.role}</span>
                    </span>
                    <span className="row__time">{s.time}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        {/* ------------------- CLIENT, MONEY, PAPER, COMMS ------------------ */}
        <div className="stack">
          <Card title="Client & contacts" icon="users">
            <ul className="contacts">
              {e.contacts.map((c) => (
                <li className={`contact ${c.primary ? 'contact--primary' : ''}`} key={c.email}>
                  <Avatar initials={c.initials} tone={c.primary ? 'brand' : 'neutral'} />
                  <div className="contact__body">
                    <span className="contact__name">
                      {c.name}
                      {c.primary && <Pill tone="brand">Primary</Pill>}
                    </span>
                    <span className="contact__role">{c.role}</span>
                    <span className="contact__lines">
                      <span>
                        <Icon name="mail" size={12} /> {c.email}
                      </span>
                      <span>
                        <Icon name="phone" size={12} /> {c.phone}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Payments" icon="dollar" subtitle={`${e.payments.percent}% of contract collected`}>
            <div className="pay">
              <div className="pay__figures">
                <Field label="Contract total" value={e.payments.total} />
                <Field label="Paid to date" value={e.payments.paid} />
                <Field label="Remaining">
                  <span className="pay__due">{e.payments.remaining}</span>
                </Field>
              </div>
              <div className="pay__bar" role="img" aria-label={`${e.payments.percent}% collected`}>
                <span className="pay__fill" style={{ width: `${e.payments.percent}%` }} />
              </div>
              <p className="pay__note">
                <Icon name="alert" size={13} />
                {e.payments.dueLabel}
              </p>
              <ul className="paylist">
                {e.payments.schedule.map((p) => (
                  <li className={`payrow payrow--${p.state}`} key={p.label}>
                    <span className="payrow__label">{p.label}</span>
                    <span className="payrow__when">{p.when}</span>
                    <span className="payrow__amount">{p.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Documents & contracts" icon="file" subtitle={`${e.documents.length} files`}>
            <ul className="rows">
              {e.documents.map((d) => (
                <li className="row row--tight" key={d.name}>
                  <span className="row__icon">
                    <Icon name="file" size={15} />
                  </span>
                  <span className="row__main">
                    <span className="row__title">{d.name}</span>
                    <span className="row__sub">{d.meta}</span>
                  </span>
                  <Pill tone={d.tone === 'attention' ? 'warning' : 'ok'}>{d.state}</Pill>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title="Recent communication"
            icon="mail"
            subtitle="Automatically filed to this event"
            action={
              <button className="btn btn--quiet" onClick={onOpenMessage}>
                Open inbox
                <Icon name="arrowRight" size={13} />
              </button>
            }
          >
            <ul className="msgs">
              {e.messages.map((m, i) => {
                const needsReply = m.needsReply && !replySent
                const isThread = m.id === 'decor-time'
                return (
                  <li key={i} className={`msg ${needsReply ? 'msg--needsReply' : ''}`}>
                    <Avatar initials={m.initials} size="sm" tone={needsReply ? 'attention' : 'neutral'} />
                    <div className="msg__body">
                      <span className="msg__top">
                        <span className="msg__from">{m.from}</span>
                        <span className="msg__when">{m.when}</span>
                      </span>
                      <span className="msg__subject">{m.subject}</span>
                      <span className="msg__preview">{m.preview}</span>
                      {isThread && (
                        <span className="msg__actions">
                          {needsReply ? (
                            <>
                              <Pill tone="urgent">Awaiting your reply</Pill>
                              <button className="btn btn--primary btn--sm" onClick={onOpenMessage}>
                                Open &amp; reply
                                <Icon name="arrowRight" size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Pill tone="ok" icon="check">
                                Replied
                              </Pill>
                              <button className="btn btn--quiet btn--sm" onClick={onOpenMessage}>
                                View thread
                              </button>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Fact({ icon, label, value, note }) {
  return (
    <div className="fact">
      <span className="fact__icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="fact__text">
        <span className="fact__label">{label}</span>
        <span className="fact__value">{value}</span>
        <span className="fact__note">{note}</span>
      </span>
    </div>
  )
}
