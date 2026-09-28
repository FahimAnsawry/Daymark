import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { usePlan } from '../lib/auth-context'
import { errorMessage } from '../lib/billing'
import { connectGoogleCalendar, useCalendarStatus, useDisconnectCalendar } from '../lib/calendar'
import { PlusGate, PreviewRow } from './PlusGate'
import {
  settingsMutedText as mutedText,
  settingsPanel as panel,
  settingsPrimaryButton as primaryButton,
  settingsQuietButton as quietButton,
} from './SettingsLayout'
import { TodayCalendar } from './TodayCalendar'

/** Calendar sync (Pro): connect Google Calendar and see today's events beside the plan. */
export function CalendarSettings() {
  const { has } = usePlan()

  return (
    <div className="max-w-[640px]">
      <p className={`m-0 text-[15px] leading-[1.6] ${mutedText}`}>
        See your Google Calendar next to today&rsquo;s plan, and how much of the day is still free.
      </p>
      {has('pro') ? (
        <CalendarPanel />
      ) : (
        <PlusGate
          plan="pro"
          title="Your calendar and your plan, side by side"
          description="Daymark reads your Google Calendar so Today shows your events and how much time is actually free. It never changes your calendar."
          preview={
            <div className="grid gap-2">
              <PreviewRow>
                <span>
                  <span className={`mr-3 tabular-nums ${mutedText}`}>09:00</span>Standup
                </span>
              </PreviewRow>
              <PreviewRow>
                <span>
                  <span className={`mr-3 tabular-nums ${mutedText}`}>13:00</span>Lunch with Sam
                </span>
              </PreviewRow>
              <PreviewRow>
                <span>
                  <span className={`mr-3 tabular-nums ${mutedText}`}>16:30</span>School pickup
                </span>
              </PreviewRow>
            </div>
          }
        />
      )}
    </div>
  )
}

function CalendarPanel() {
  const status = useCalendarStatus()
  const disconnect = useDisconnectCalendar()
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string>()

  if (status.isPending) {
    return (
      <p className={`mt-8 text-sm ${mutedText}`} role="status">
        Checking your calendar…
      </p>
    )
  }

  const connected = status.data?.connected === true

  return (
    <>
      <section aria-labelledby="google-title" className={`${panel} mt-8`}>
        <h2
          id="google-title"
          className="m-0 flex items-center gap-2 font-display text-[1.15rem] font-semibold tracking-[-0.02em]"
        >
          <CalendarDays size={18} aria-hidden="true" /> Google Calendar
        </h2>
        <p className={`m-0 mt-1.5 max-w-[52ch] text-sm leading-[1.55] ${mutedText}`}>
          {connected
            ? `Connected${status.data?.email ? ` as ${status.data.email}` : ''}. Today shows your events for the day.`
            : 'Daymark asks only to read your calendar. Your events stay in Google.'}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {connected ? (
            <button
              type="button"
              className={quietButton}
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button
              type="button"
              className={primaryButton}
              disabled={connecting}
              onClick={() => {
                setConnecting(true)
                setConnectError(undefined)
                connectGoogleCalendar().catch((error: unknown) => {
                  setConnecting(false)
                  setConnectError(
                    errorMessage(error, 'We couldn’t reach Google. Please try again.'),
                  )
                })
              }}
            >
              {connecting ? 'Opening Google…' : 'Connect Google Calendar'}
            </button>
          )}
        </div>
        {(connectError || disconnect.isError) && (
          <p role="alert" className="m-0 mt-2 text-sm text-red-700 dark:text-red-300">
            {connectError ??
              errorMessage(disconnect.error, 'We couldn’t disconnect. Please try again.')}
          </p>
        )}
      </section>
      {connected && (
        <div className="mt-8">
          <TodayCalendar />
        </div>
      )}
    </>
  )
}
