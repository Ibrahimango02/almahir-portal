"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { TicketSubmissionDialog } from "@/components/ticket-submission-dialog"

export function DevelopmentBanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <div className="w-full bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/50 px-4 py-3 md:pl-65">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This system is still under development. If you have any issues or suggestions, please submit them{" "}
              <Button
                variant="link"
                className="h-auto p-0 text-amber-900 dark:text-amber-100 underline font-semibold"
                onClick={() => setIsDialogOpen(true)}
              >
                here
              </Button>
              .
            </p>
          </div>
        </div>
      </div>
      <TicketSubmissionDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

