"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, Download, FileText, X } from "lucide-react"

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptUrl: string | null
  title?: string
  subtitle?: string
}

export function ReceiptModal({ open, onOpenChange, receiptUrl, title, subtitle }: ReceiptModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const handleDownload = () => {
    if (!receiptUrl) return
    const a = document.createElement("a")
    a.href = receiptUrl
    a.download = `receipt-${title ? title.toLowerCase().replace(/\s+/g, "-") : "billbrain"}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) handleReset()
      onOpenChange(o)
    }}>
      <DialogContent className="max-w-2xl sm:max-w-3xl p-0 overflow-hidden bg-background/95 backdrop-blur-md border-border/60">
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-border/40 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {title || "Attached Receipt"}
            </DialogTitle>
            {subtitle && (
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </DialogDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomIn}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleZoomOut}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleRotate}
              title="Rotate 90°"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-primary"
              onClick={handleDownload}
              title="Download Receipt"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative min-h-[350px] max-h-[70vh] flex items-center justify-center p-4 bg-muted/20 overflow-auto">
          {receiptUrl ? (
            <div 
              className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={receiptUrl} 
                alt="Receipt Document" 
                className="max-h-[60vh] max-w-full rounded-lg shadow-md object-contain border border-border/40"
              />
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>No receipt image attached to this transaction.</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-muted/10 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground px-6">
          <span>Zoom: {Math.round(scale * 100)}% • Rotation: {rotation}°</span>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs">
            Reset View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
