"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: TablePaginationProps) {
  // Calculate the range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5 // Show at most 5 page numbers

    // Always show first page
    if (currentPage > 3) {
      pages.push(1)
      if (currentPage > 4) {
        pages.push("ellipsis")
      }
    }

    // Calculate range of pages to show around current page
    const startPage = Math.max(1, currentPage - 1)
    const endPage = Math.min(totalPages, currentPage + 1)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push("ellipsis")
      }
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="flex flex-col-reverse sm:flex-row items-center justify-between space-y-4 space-y-reverse sm:space-y-0 py-4">
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <div>
          {totalItems > 0 ? (
            <>
              Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span>{" "}
              of <span className="font-medium">{totalItems}</span> results
            </>
          ) : (
            "No results"
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center">
          {getPageNumbers().map((page, index) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${index}-${currentPage}`} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? "green" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0 font-medium"
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
