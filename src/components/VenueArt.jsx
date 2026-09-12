// ---------------------------------------------------------------------------
// Venue artwork, drawn as inline SVG.
//
// Illustration rather than photography on purpose: it ships inside the repo, so
// it can never 404, needs no license, and is drawn from the same palette tokens
// as the rest of the product, which keeps the page feeling like one thing.
//
// It is decorative only — every SVG is aria-hidden, and no information is
// carried by the artwork alone.
// ---------------------------------------------------------------------------

// Wide banner used at the top of the event workspace. The left side fades to
// the page background so overlaid text stays readable.
export function VenueBanner() {
  return (
    <svg
      className="art art--banner"
      viewBox="0 0 1200 210"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="wsSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f1ec" />
          <stop offset="100%" stopColor="#e3ede7" />
        </linearGradient>
        <linearGradient id="wsScrim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0.82" />
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="1200" height="210" fill="url(#wsSky)" />
      <circle cx="965" cy="66" r="42" fill="#ffffff" opacity="0.55" />

      {/* distant ridge */}
      <path
        d="M0,150 C150,122 300,142 450,128 C600,113 750,138 900,122 C1050,107 1150,128 1200,120 L1200,210 L0,210 Z"
        fill="#dcebe2"
      />
      {/* nearer ridge */}
      <path
        d="M0,168 C200,148 350,163 520,153 C700,143 850,165 1000,152 C1100,145 1160,157 1200,152 L1200,210 L0,210 Z"
        fill="#c7ded1"
      />

      {/* stone hall */}
      <g fill="#a8c4b6">
        <path d="M826,104 L916,60 L1006,104 Z" />
        <rect x="843" y="102" width="146" height="68" />
      </g>
      <g fill="#e7f0ea">
        <path d="M867,152 L867,128 A10,10 0 0 1 887,128 L887,152 Z" />
        <path d="M906,152 L906,124 A10,10 0 0 1 926,124 L926,152 Z" />
        <path d="M945,152 L945,128 A10,10 0 0 1 965,128 L965,152 Z" />
      </g>

      {/* Willows sit to the right of the text scrim. Anything drawn under the
          scrim reads as a pale smudge rather than a tree, so the composition
          keeps the left third clear for the headline. */}
      <WillowTree x={575} y={176} scale={0.95} />
      <WillowTree x={706} y={174} scale={0.66} />

      {/* string lights strung from the trees to the hall */}
      <path d="M585,104 Q648,136 706,118" stroke="#b4c9bd" strokeWidth="1.6" fill="none" />
      <path d="M706,118 Q792,132 872,88" stroke="#b4c9bd" strokeWidth="1.6" fill="none" />
      {[
        [608, 118],
        [634, 128],
        [660, 131],
        [686, 126],
        [742, 126],
        [780, 128],
        [818, 117],
        [850, 100]
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.1" fill="#f0d9a8" stroke="#dcc08a" strokeWidth="0.8" />
      ))}

      {/* foreground lawn */}
      <path d="M0,182 C220,172 420,186 640,178 C860,170 1040,186 1200,178 L1200,210 L0,210 Z" fill="#2e5a4b" opacity="0.13" />

      {/* text scrim */}
      <rect width="1200" height="210" fill="url(#wsScrim)" />
    </svg>
  )
}

// Compact scene used beside the dashboard greeting. Same world, smaller frame,
// and short enough that it costs almost no vertical space.
export function VenueVignette() {
  return (
    <svg
      className="art art--vignette"
      viewBox="0 0 330 104"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Dissolves the left edge into the card so the illustration reads as
            part of the surface rather than a pasted-in rectangle. */}
        <linearGradient id="wsVigFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="38%" stopColor="#ffffff" />
        </linearGradient>
        <mask id="wsVigMask">
          <rect width="330" height="104" fill="url(#wsVigFade)" />
        </mask>
      </defs>

      <g mask="url(#wsVigMask)">
        <circle cx="262" cy="28" r="19" fill="#ffffff" opacity="0.6" />

        <path d="M0,72 C70,60 130,72 200,66 C260,61 300,72 330,67 L330,104 L0,104 Z" fill="#dcebe2" />
        <path d="M0,84 C80,75 150,85 220,80 C275,76 305,85 330,81 L330,104 L0,104 Z" fill="#c7ded1" />

        <g fill="#a8c4b6">
          <path d="M232,56 L268,38 L304,56 Z" />
          <rect x="240" y="55" width="58" height="30" />
        </g>
        <g fill="#e7f0ea">
          <path d="M251,79 L251,68 A5,5 0 0 1 261,68 L261,79 Z" />
          <path d="M277,79 L277,68 A5,5 0 0 1 287,68 L287,79 Z" />
        </g>

        <WillowTree x={158} y={88} scale={0.56} />
        <WillowTree x={206} y={90} scale={0.4} />

        <path d="M164,58 Q200,86 232,60" stroke="#b4c9bd" strokeWidth="1.2" fill="none" />
        {[
          [180, 72],
          [198, 78],
          [216, 72]
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.2" fill="#f0d9a8" stroke="#dcc08a" strokeWidth="0.6" />
        ))}

        <path d="M0,92 C90,86 180,95 260,90 C300,88 316,93 330,91 L330,104 L0,104 Z" fill="#2e5a4b" opacity="0.12" />
      </g>
    </svg>
  )
}

// A willow: trunk, soft canopy, and a few drooping strands.
function WillowTree({ x, y, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-3,0 L-2,-46 L2,-46 L3,0 Z" fill="#9a8f7e" />
      <ellipse cx="0" cy="-58" rx="42" ry="26" fill="#8fb3a0" />
      <ellipse cx="-16" cy="-52" rx="26" ry="18" fill="#9dbfad" />
      <ellipse cx="18" cy="-54" rx="24" ry="17" fill="#82a996" />
      <g stroke="#8fb3a0" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M-34,-52 C-36,-38 -33,-28 -35,-18" />
        <path d="M-20,-42 C-23,-28 -19,-18 -22,-8" />
        <path d="M-6,-38 C-8,-24 -5,-14 -7,-4" />
        <path d="M9,-40 C7,-26 10,-16 8,-6" />
        <path d="M23,-44 C21,-30 24,-22 22,-12" />
        <path d="M34,-50 C33,-38 35,-30 33,-22" />
      </g>
    </g>
  )
}
