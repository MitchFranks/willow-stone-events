// ---------------------------------------------------------------------------
// SCREEN 2 — Johnson Wedding workspace.
// Job: the entire status of one event, without opening anything else.
//
// REVISION NOTE (progressive disclosure):
// v1 stacked eleven cards in two columns, all expanded. Everything was visible,
// which meant nothing was dominant and a first-time viewer read the screen as
// "a lot of information" rather than "everything in one place".
//
// The page now pins only what is true of the event no matter what you came to
// do — who/when/where, and what needs attention — and files the rest behind
// tabs. Nothing was removed. Each tab carries a count so the hidden content
// still announces itself.
//
// GROUPING: three fixed bands, then one tabbed region.
//   1. Identity        (banner, name, the four constant facts)
//   2. Needs attention (tinted, above the fold, same language as the dashboard)
//   3. Detail          (tabbed: timeline / tasks / vendors & staff / payments /
//                       client / documents / messages)
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Avatar, Field, Icon, Pill, TabPanel, Tabs } from './ui.jsx'
import estateImage from '../assets/event-estate.jpg'
import { johnson } from '../data.js'

export function EventWorkspace({ attention, replySent, onBack, onOpenMessage }) {
  const [tab, setTab] = useState('timeline')
  const open = attention.filter((item) => !item.resolved)
  const resolved = attention.filter((item) => item.resolved)
  const e = johnson

  const openTasks = e.tasks.filter((t) => t.open && !(replySent && t.id === 'decor-time')).length
  const unread = e.messages.filter((m) => m.needsReply && !replySent).length

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: 'clock' },
    { id: 'tasks', label: 'Tasks', icon: 'check', count: openTasks, tone: openTasks > 0 ? 'urgent' : 'ok' },
    { id: 'team', label: 'Vendors & staff', icon: 'link', count: e.vendors.length },
    { id: 'payments', label: 'Payments', icon: 'dollar' },
    { id: 'client', label: 'Client', icon: 'users', count: e.contacts.length },
    { id: 'documents', label: 'Documents', icon: 'file', count: e.documents.length },
    {
      id: 'messages',
      label: 'Messages',
      icon: 'mail',
      count: unread > 0 ? unread : e.messages.length,
      tone: unread > 0 ? 'urgent' : undefined
    }
  ]

  return (
    <div className="stack-lg">
      {/* ------------------------- IDENTITY BAND ------------------------- */}
      <section className="eventhead">
        <img className="eventhead__img" src={estateImage} alt="" />
        <div className="eventhead__scrim" aria-hidden="true" />
        <div className="eventhead__overlay">
          <button className="backlink backlink--onDark" onClick={onBack}>
            <Icon name="arrowLeft" size={15} />
            All events
          </button>
          <h1 className="eventhead__title">{e.name}</h1>
          <p className="eventhead__sub">
            {e.clients ?? 'Emily & Marcus Johnson'} · {e.package}
          </p>
          <div className="eventhead__pill">
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
      </section>

      <section className="factbar">
        <Fact icon="calendar" label="Date" value={e.date} note={e.countdown} />
        <Fact icon="clock" label="Ceremony" value={e.ceremony} note="Guest arrival 3:30 PM" />
        <Fact icon="users" label="Guest count" value={`${e.guests} confirmed`} note="Final count due Sep 14" />
        <Fact icon="pin" label="Spaces" value="Garden Terrace" note="Reception in Stone Hall" />
      </section>

      {/* ------------------------ ATTENTION BAND ------------------------- */}
      <section className="attention attention--event">
        <header className="attention__head">
          <div className="attention__headText">
            <h2 className="attention__title">
              <Icon name="alert" size={20} />
              Needs your attention
            </h2>
            <p className="attention__sub">
              {open.length > 0
                ? `${open.length} ${open.length === 1 ? 'thing stands' : 'things stand'} between this event and ready.`
                : 'Nothing outstanding — this event is ready.'}
            </p>
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
                  <button className="btn btn--secondary btn--sm" onClick={() => setTab(item.id === 'balance' ? 'payments' : 'team')}>
                    {item.id === 'balance' ? 'View payments' : 'View vendor'}
                    <Icon name="arrowRight" size={13} />
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      </section>

      {/* -------------------------- DETAIL BAND -------------------------- */}
      <section className="tabwrap">
        <Tabs tabs={tabs} active={tab} onChange={setTab} label="Event details" />

        <div className="tabbody">
          <TabPanel id="timeline" active={tab}>
            <PanelHead
              title="Day-of timeline"
              meta={replySent ? 'Updated just now' : 'Draft v2 · awaiting client sign-off'}
            />
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
                        {slot.flagged && replySent && (
                          <Pill tone="ok" icon="check">
                            Confirmed 9:00 AM
                          </Pill>
                        )}
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
          </TabPanel>

          <TabPanel id="tasks" active={tab}>
            <PanelHead
              title="Tasks"
              meta={`${openTasks} open · ${e.tasks.filter((t) => !t.open).length + (replySent ? 1 : 0)} complete`}
            />
            <ul className="tasks">
              {e.tasks.map((task) => {
                const done = !task.open || (replySent && task.id === 'decor-time')
                return (
                  <li
                    key={task.id}
                    className={`task ${done ? 'task--done' : ''} ${task.flagged && !done ? 'task--flagged' : ''}`}
                  >
                    <span className="task__box" aria-hidden="true">
                      {done && <Icon name="check" size={12} />}
                    </span>
                    <span className="task__label">{task.label}</span>
                    <span className="task__due">{done && task.open ? 'Completed just now' : task.due}</span>
                  </li>
                )
              })}
            </ul>
          </TabPanel>

          <TabPanel id="team" active={tab}>
            <div className="split-2">
              <div>
                <PanelHead title="Vendors" meta={`${e.vendors.length} booked`} />
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
                      <Pill
                        tone={v.tone === 'attention' ? 'warning' : 'ok'}
                        icon={v.tone === 'attention' ? 'alert' : 'check'}
                      >
                        {v.state}
                      </Pill>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <PanelHead title="Staff" meta="8 scheduled · published Sep 8" />
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
              </div>
            </div>
          </TabPanel>

          <TabPanel id="payments" active={tab}>
            <PanelHead title="Payments" meta={`${e.payments.percent}% of contract collected`} />
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
          </TabPanel>

          <TabPanel id="client" active={tab}>
            <PanelHead title="Client & contacts" meta={`${e.contacts.length} people`} />
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
          </TabPanel>

          <TabPanel id="documents" active={tab}>
            <PanelHead title="Documents & contracts" meta={`${e.documents.length} files`} />
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
          </TabPanel>

          <TabPanel id="messages" active={tab}>
            <PanelHead title="Recent communication" meta="Automatically filed to this event" />
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
          </TabPanel>
        </div>
      </section>
    </div>
  )
}

function PanelHead({ title, meta }) {
  return (
    <header className="panelhead">
      <h3 className="panelhead__title">{title}</h3>
      {meta && <span className="panelhead__meta">{meta}</span>}
    </header>
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
