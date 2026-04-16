import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { BookOpen, BarChart3, FileText, MessageCircle, ChevronRight } from 'lucide-react'

interface WelcomeModalProps {
  studentName: string
  onComplete: () => void
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Homework & Past Papers',
    description: 'Submit your work and get detailed feedback on every question.',
  },
  {
    icon: BarChart3,
    title: 'Performance Tracking',
    description: 'See exactly which topics you are smashing and where to focus next.',
  },
  {
    icon: FileText,
    title: 'Custom Worksheets',
    description: 'Get practice sheets tailored to the topics you need the most.',
  },
  {
    icon: MessageCircle,
    title: 'Ask Questions',
    description: 'Stuck on a problem? Ask and get a clear explanation.',
  },
]

export function WelcomeModal({ studentName, onComplete }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  const firstName = studentName.split(' ')[0]

  const handleClose = (open: boolean) => {
    if (!open) onComplete()
  }

  if (step === 0) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="dark:bg-p-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-p-100">
              <span className="text-3xl">👋</span>
            </div>
            <DialogTitle className="text-2xl">Welcome, {firstName}!</DialogTitle>
            <DialogDescription className="text-base">
              Your BEAM Portal is ready. Here is a quick look at what you can do.
            </DialogDescription>
          </DialogHeader>

          <button
            onClick={() => setStep(1)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-p-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-p-700"
          >
            Show me around
            <ChevronRight className="h-4 w-4" />
          </button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">What you can do here</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-lg border border-g-200 p-3 dark:border-g-700"
            >
              <div className="dark:bg-p-900/30 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-p-100">
                <feature.icon className="h-5 w-5 text-p-600 dark:text-p-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-g-900 dark:text-g-100">{feature.title}</p>
                <p className="text-xs text-g-500 dark:text-g-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-p-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-p-700"
        >
          Let's go
          <ChevronRight className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  )
}
