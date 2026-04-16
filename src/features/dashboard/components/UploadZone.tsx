import { useState, useRef, useCallback } from 'react'
import { Upload, Camera, FileText } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

interface UploadZoneProps {
  homeworkId: string
  homeworkTitle: string
  onFileSelect: (files: FileList) => void
  disabled?: boolean
  className?: string
}

export function UploadZone({
  homeworkId,
  homeworkTitle,
  onFileSelect,
  disabled = false,
  className,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
      setIsExpanded(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files)
      }
    },
    [onFileSelect]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files)
      }
    },
    [onFileSelect]
  )

  //  "Context-First with Inline Upload"
  // Show assignment context first, upload expands on interaction

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        disabled={disabled}
        className={cn(
          'group flex w-full items-center justify-between rounded-lg border-2 border-dashed',
          'border-g-300 bg-g-50 p-4 text-left transition-all',
          'hover:border-primary-400 hover:bg-primary-50',
          'dark:hover:border-primary-500 dark:hover:bg-primary-900/20',
          'focus:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary-100 dark:bg-primary-900/50 rounded-lg p-2">
            <Upload className="text-primary-600 dark:text-primary-400 h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-g-900">Upload your work</p>
            <p className="text-sm text-g-500">Click or drag PDF to submit</p>
          </div>
        </div>
        <FileText className="group-hover:text-primary-500 h-5 w-5 text-g-400 transition-colors" />
      </button>
    )
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-lg border-2 border-dashed p-6 transition-all',
        isDragActive
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-g-300 bg-g-50',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        id={`file-upload-${homeworkId}`}
        disabled={disabled}
        aria-label="Choose PDF file to upload"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id={`camera-upload-${homeworkId}`}
        disabled={disabled}
        aria-label="Take photo to upload"
      />

      <div className="text-center">
        <div className="bg-primary-100 dark:bg-primary-900/50 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Upload
            className={cn(
              'h-7 w-7 transition-transform',
              isDragActive ? 'text-primary-600 scale-110' : 'text-primary-500'
            )}
          />
        </div>

        <p className="mb-2 text-lg font-medium text-g-900">
          {isDragActive ? 'Drop your file here' : 'Submit your work'}
        </p>

        <p className="mb-4 text-sm text-g-500">for "{homeworkTitle}"</p>

        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Choose PDF
          </Button>

          {/* Show camera button on mobile */}
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
            className="gap-2 sm:hidden"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
        </div>

        <p className="mt-4 text-xs text-g-400">PDF format only - Max 10MB</p>
        <p className="mt-1 text-xs text-g-400">Submissions cannot be withdrawn once sent.</p>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setIsExpanded(false)}
        className="absolute right-2 top-2 rounded p-1 text-g-400 hover:bg-g-200"
        aria-label="Collapse upload zone"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
