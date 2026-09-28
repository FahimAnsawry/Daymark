import { useEffect, useState } from 'react'
import { LoadingPage } from './LoadingPage'

export function AppSplash() {
  const [showSplash, setShowSplash] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFading(true)
      const removeTimer = setTimeout(() => {
        setShowSplash(false)
      }, 300)
      return () => clearTimeout(removeTimer)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!showSplash) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] transition-opacity duration-300 ease-out ${
        isFading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <LoadingPage fullScreen />
    </div>
  )
}
