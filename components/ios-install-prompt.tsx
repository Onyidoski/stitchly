'use client'

import { useState, useEffect } from "react"
import { X, Share, PlusSquare } from "lucide-react"

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 1. Check if user is on iOS (iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)

    // 2. Check if app is already installed (standalone mode)
    // @ts-ignore
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

    // 3. Check if user dismissed this recently
    const hasDismissed = localStorage.getItem('ios-install-prompt-dismissed')

    // Only show if: iOS + Not Installed + Not Dismissed
    if (isIOS && !isStandalone && !hasDismissed) {
      setShowPrompt(true)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session (or use a timestamp to show again after 7 days)
    localStorage.setItem('ios-install-prompt-dismissed', 'true')
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 md:max-w-md md:mx-auto">
        
        <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="font-semibold text-slate-900 text-sm">Install Stitchly</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    For the best experience, we recommend adding Stitchly to your home screen. This gives you faster access and a full-screen view.
                </p>
            </div>
            <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
            </button>
        </div>

        <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded bg-blue-100 text-blue-600 font-bold text-xs">1</span>
                <span>Tap the <Share className="inline h-4 w-4 mx-1 text-blue-500" /> <span className="font-medium">Share</span> button below</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-6 w-6 rounded bg-blue-100 text-blue-600 font-bold text-xs">2</span>
                <span>Select <span className="font-medium">Add to Home Screen</span> <PlusSquare className="inline h-4 w-4 mx-1 text-slate-500" /></span>
            </div>
        </div>
      </div>
    </div>
  )
}