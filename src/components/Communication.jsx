// ---------------------------------------------------------------------------
// SCREEN 3 — Message thread + AI assisted reply.
// Job: resolve the thing that needs attention without leaving the system.
//
// The assistant DRAFTS; the manager decides. The draft sits in an editable
// field and nothing leaves the building until "Send reply" is pressed — the
// human is always the one who sends.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Avatar, Card, Icon, Pill } from './ui.jsx'
import { aiBasis, aiDraft, johnson, thread, threadContext, venue } from '../data.js'

export function Communication({ replySent, onSend, onBackToEvent, onBackToDashboard }) {
  const [draft, setDraft] = useState(aiDraft)
  const [sending, setSending] = useState(false)

  function handleSend() {
    if (sending || replySent) return
    setSending(true)
    // Simulated network latency so the button visibly responds.
    setTimeout(() => {
      setSending(false)
      onSend()
    }, 650)
  }

  return (
    <div className="stack-lg">
      <div className="pagehead pagehead--event">
        <div>
          <button className="backlink" onClick={onBackToEvent}>
            <Icon name="arrowLeft" size={15} />
            Johnson Wedding workspace
          </button>
          <h1 className="pagehead__title">{thread.subject}</h1>
          <p className="pagehead__sub">
            <Icon name="link" size={13} /> Filed automatically to {thread.linkedEvent}
          </p>
        </div>
        <div className="pagehead__aside">
          {replySent ? (
            <Pill tone="ok" icon="check">
              Replied
            </Pill>
          ) : (
            <Pill tone="urgent" icon="alert">
              Awaiting your reply
            </Pill>
          )}
        </div>
      </div>

      {replySent && (
        <div className="banner" role="status">
          <span className="banner__icon">
            <Icon name="checkCircle" size={20} />
          </span>
          <div className="banner__body">
            <p className="banner__title">Reply sent to {thread.fromEmail}</p>
            <p className="banner__text">
              “Decorating time change requested by the bride” is now resolved. The Johnson Wedding timeline shows
              9:00 AM decorating access, and the event has 2 open items remaining.
            </p>
          </div>
          <div className="banner__actions">
            <button className="btn btn--secondary" onClick={onBackToEvent}>
              Back to event
              <Icon name="arrowRight" size={14} />
            </button>
            <button className="btn btn--quiet" onClick={onBackToDashboard}>
              Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="split split--comms">
        {/* ------------------------- THE CONVERSATION ------------------------ */}
        <div className="stack">
          <Card title="Message" icon="mail">
            <article className="email">
              <header className="email__head">
                <Avatar initials={thread.initials} tone="brand" />
                <div className="email__meta">
                  <span className="email__from">
                    {thread.from}
                    <span className="email__address">{thread.fromEmail}</span>
                  </span>
                  <span className="email__when">{thread.when}</span>
                </div>
              </header>
              <div className="email__body">
                {thread.body.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </article>

            {replySent && (
              <article className="email email--sent">
                <header className="email__head">
                  <Avatar initials={venue.managerInitials} />
                  <div className="email__meta">
                    <span className="email__from">
                      {venue.manager}
                      <span className="email__address">{venue.managerRole}</span>
                    </span>
                    <span className="email__when">
                      <Pill tone="ok" icon="check">
                        Sent just now
                      </Pill>
                    </span>
                  </div>
                </header>
                <div className="email__body email__body--sent">
                  {draft.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </article>
            )}
          </Card>

          {/* --------------------------- AI DRAFT --------------------------- */}
          {!replySent && (
            <section className="composer">
              <header className="composer__head">
                <div className="composer__headText">
                  <h2 className="composer__title">
                    <Icon name="sparkle" size={16} />
                    Suggested reply
                  </h2>
                  <p className="composer__sub">
                    Drafted from this event’s data. Review and edit before sending — nothing is sent automatically.
                  </p>
                </div>
                <Pill tone="brand">Draft · not sent</Pill>
              </header>

              <div className="composer__basis">
                <span className="composer__basisLabel">Based on</span>
                <ul className="chips">
                  {aiBasis.map((b) => (
                    <li className="chip" key={b}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="composer__field">
                <label className="composer__label" htmlFor="reply">
                  To {thread.fromEmail} · Re: {thread.subject}
                </label>
                <textarea
                  id="reply"
                  className="composer__input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={22}
                  spellCheck="false"
                />
                <p className="composer__hint">
                  <Icon name="check" size={13} />
                  You are editing the draft. It sends only when you press Send reply.
                </p>
              </div>

              <footer className="composer__foot">
                <div className="composer__footLeft">
                  <button className="btn btn--quiet" onClick={() => setDraft(aiDraft)} disabled={draft === aiDraft}>
                    Restore original draft
                  </button>
                </div>
                <div className="composer__footRight">
                  <button className="btn btn--secondary" onClick={onBackToEvent}>
                    Cancel
                  </button>
                  <button className={`btn btn--primary btn--lg ${sending ? 'is-busy' : ''}`} onClick={handleSend} disabled={sending}>
                    <Icon name="send" size={15} />
                    {sending ? 'Sending…' : 'Send reply'}
                  </button>
                </div>
              </footer>
            </section>
          )}
        </div>

        {/* --------------------------- THE CONTEXT -------------------------- */}
        <div className="stack">
          <Card
            title="Event context"
            icon="calendar"
            subtitle="Everything needed to answer, in place"
            action={
              <button className="btn btn--quiet btn--sm" onClick={onBackToEvent}>
                Open workspace
                <Icon name="arrowRight" size={13} />
              </button>
            }
          >
            <dl className="context">
              {threadContext.map((item) => (
                <div className="context__row" key={item.label}>
                  <dt className="context__label">{item.label}</dt>
                  <dd className="context__value">{item.value}</dd>
                </div>
              ))}
            </dl>
            <p className="context__verdict">
              <Icon name="checkCircle" size={15} />
              No conflict found — a 9:00 AM start is available.
            </p>
          </Card>

          <Card title="Other open items" icon="alert" subtitle="Johnson Wedding">
            <ul className="rows">
              <li className="row row--tight">
                <span className="row__main">
                  <span className="row__title">Final catering guest count</span>
                  <span className="row__sub">Harvest Table · due Mon, Sep 14</span>
                </span>
                <Pill tone="urgent">Open</Pill>
              </li>
              <li className="row row--tight">
                <span className="row__main">
                  <span className="row__title">Remaining balance $4,250</span>
                  <span className="row__sub">Due Thu, Sep 17</span>
                </span>
                <Pill tone="warning">Open</Pill>
              </li>
            </ul>
            <p className="card__footnote">The draft asks for the guest count too, so one reply clears two items.</p>
          </Card>

          <Card title="Client" icon="users">
            <ul className="contacts">
              {johnson.contacts.slice(0, 2).map((c) => (
                <li className="contact" key={c.email}>
                  <Avatar initials={c.initials} tone={c.primary ? 'brand' : 'neutral'} size="sm" />
                  <div className="contact__body">
                    <span className="contact__name">{c.name}</span>
                    <span className="contact__role">{c.role}</span>
                    <span className="contact__lines">
                      <span>
                        <Icon name="phone" size={12} /> {c.phone}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
