// Share button for Document Pack cards
// Uses Web Share API when available, renders nothing otherwise

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface ShareButtonProps {
  title: string
  text: string
  getUrl: () => Promise<string | null>
}

/**
 * Share button using the Web Share API.
 * Only renders on devices that support navigator.share (mobile, some desktop).
 * On unsupported devices, renders nothing.
 */
export function ShareButton({ title, text, getUrl }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false)

  // Only render if Web Share API is available
  if (typeof navigator === 'undefined' || !navigator.share) {
    return null
  }

  async function handleShare() {
    setSharing(true)
    try {
      const url = await getUrl()
      if (!url) return
      await navigator.share({ title, text, url })
    } catch (err) {
      // User cancelled or share failed — silently ignore
      if ((err as Error).name !== 'AbortError') {
        console.warn('[ShareButton] Share failed:', err)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={handleShare}
      disabled={sharing}
      aria-label={`Share ${title}`}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  )
}
