import { useState } from 'react'
import type { User } from '../lib/auth-context'

// Burnt orange behind the initial, soft orange in dark mode.
const defaultTone = 'bg-[#c2410c] text-white dark:bg-[#fed7aa] dark:text-[#1f2937]'

type Props = {
  user: Pick<User, 'name' | 'avatar'>
  /** Size and text size, such as `h-8 w-8 text-sm`. */
  className?: string
  /** Colors shown behind the initial. */
  tone?: string
}

/** The user's profile image, or their initial when there isn't one (or it fails to load). */
export function UserAvatar({ user, className = 'h-8 w-8 text-sm', tone = defaultTone }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = Boolean(user.avatar) && failedSrc !== user.avatar

  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full font-bold ${tone} ${className}`}
    >
      {user.name?.[0]?.toUpperCase() || 'D'}
      {showImage && (
        <img
          src={user.avatar ?? undefined}
          alt=""
          // Google's image host refuses some requests that carry a referrer.
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedSrc(user.avatar ?? null)}
        />
      )}
    </span>
  )
}
