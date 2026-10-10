import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { StoreProvider } from '@/lib/store'
import { Staffing2Provider } from '@/lib/staffing/store'
import { TimelineEditsProvider } from '@/lib/timelineEdits'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'

// One family: Geist for all UI text, Geist Mono for times, money and counts
// that need to line up. The `geist` package self-hosts the files, so the
// build never depends on reaching Google Fonts.

export const metadata = {
  title: 'Vue — Wedding Venue Operations',
  description:
    'Clickable prototype of an operations platform for wedding venues. Simulated data.',
  icons: {
    icon:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%231b1c1e'/%3E%3Ctext x='16' y='22.5' font-family='Helvetica,Arial,sans-serif' font-size='17' font-weight='300' fill='%23fafafa' text-anchor='middle'%3EV%3C/text%3E%3C/svg%3E"
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <TimelineEditsProvider>
          {/* The planner sits outside the store so Up Next can be derived from it. */}
          <Staffing2Provider>
            <StoreProvider>
              <OnboardingProvider>{children}</OnboardingProvider>
            </StoreProvider>
          </Staffing2Provider>
        </TimelineEditsProvider>
      </body>
    </html>
  )
}
