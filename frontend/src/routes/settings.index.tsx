import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettings } from '../components/ProfileSettings'
import { SettingsLayout } from '../components/SettingsLayout'

export const Route = createFileRoute('/settings/')({
  component: ProfileSettingsPage,
})

function ProfileSettingsPage() {
  return (
    <SettingsLayout title="Profile" description="Your name, how you sign in and how Daymark looks.">
      {(user) => <ProfileSettings user={user} />}
    </SettingsLayout>
  )
}
