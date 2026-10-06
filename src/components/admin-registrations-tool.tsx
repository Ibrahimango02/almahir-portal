"use client"

import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ClipboardList, Download, Filter, Search, Wrench, X } from "lucide-react"
import * as XLSX from "xlsx"
import { AdminRegistrationsToolFilters, AdminRegistrationsToolRow } from "@/types"
import { getRegistrationsToolData } from "@/lib/get/get-admin-tools"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/table-pagination"

const tableHeaderCellClass = "text-[13px] font-semibold text-[#1f5133] whitespace-nowrap leading-5"

function formatDateValue(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

function formatCreatedAt(value: string): string {
    try {
        return format(parseISO(value), "MMM d, yyyy hh:mm a")
    } catch {
        return value
    }
}

function display(value: string | null | undefined): string {
    return value && value.trim() ? value : "-"
}

export function AdminRegistrationsTool() {
    const [rows, setRows] = useState<AdminRegistrationsToolRow[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [hasAppliedFilters, setHasAppliedFilters] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState("")
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [endDate, setEndDate] = useState<Date | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(100)

    const normalizedFilters = useMemo<AdminRegistrationsToolFilters>(
        () => ({
            search: search.trim() || undefined,
            startDate: startDate ? formatDateValue(startDate) : undefined,
            endDate: endDate ? formatDateValue(endDate) : undefined,
        }),
        [search, startDate, endDate]
    )

    const fetchRows = async (page = currentPage, perPage = pageSize) => {
        try {
            setLoading(true)
            setError(null)
            const data = await getRegistrationsToolData(normalizedFilters, { page, pageSize: perPage })
            setRows(data.rows)
            setTotalItems(data.totalItems)
        } catch (fetchError) {
            console.error("Error loading registrations:", fetchError)
            setError("Failed to load registrations")
            setRows([])
            setTotalItems(0)
        } finally {
            setHasAppliedFilters(true)
            setLoading(false)
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    const handleApply = async () => {
        setCurrentPage(1)
        await fetchRows(1, pageSize)
    }

    const handlePageChange = async (page: number) => {
        setCurrentPage(page)
        await fetchRows(page, pageSize)
    }

    const handlePageSizeChange = async (newPageSize: number) => {
        setPageSize(newPageSize)
        setCurrentPage(1)
        await fetchRows(1, newPageSize)
    }

    const handleExportExcel = async () => {
        try {
            setExporting(true)
            setError(null)

            const exportPageSize = 500
            let exportPage = 1
            let total = 0
            let collectedRows: AdminRegistrationsToolRow[] = []

            do {
                const data = await getRegistrationsToolData(normalizedFilters, {
                    page: exportPage,
                    pageSize: exportPageSize,
                })
                total = data.totalItems
                collectedRows = [...collectedRows, ...data.rows]
                if (data.rows.length === 0) break
                exportPage += 1
            } while (collectedRows.length < total)

            const worksheetRows = collectedRows.map((row) => ({
                Name: row.name,
                Gender: display(row.gender),
                Age: display(row.age),
                "Parent/Guardian": display(row.parent_guardian_name),
                "Relation to Applicant": display(row.relation_to_applicant),
                "First Language": display(row.first_language),
                Country: display(row.country),
                Email: display(row.email),
                Phone: display(row.phone),
                WhatsApp: display(row.whatsapp),
                Program: display(row.program),
                "Class Duration": display(row.class_duration),
                Availability: row.availability?.join(", ") || "-",
                "Heard About Us": display(row.hear_about_us),
                "Friend Name": display(row.friend_name),
                Comments: display(row.comments),
                "Submitted At": formatCreatedAt(row.created_at),
            }))

            const worksheet = XLSX.utils.json_to_sheet(worksheetRows)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "registrations")
            XLSX.writeFile(workbook, `registrations_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`)
        } catch (exportError) {
            console.error("Error exporting registrations:", exportError)
            setError("Failed to export registrations")
        } finally {
            setExporting(false)
        }
    }

    const clearFilters = () => {
        setSearch("")
        setStartDate(undefined)
        setEndDate(undefined)
        setRows([])
        setTotalItems(0)
        setCurrentPage(1)
        setHasAppliedFilters(false)
        setError(null)
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Search</label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") handleApply()
                                    }}
                                    placeholder="Name, email, guardian, country..."
                                    className="pl-8 bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Submitted From</label>
                            <DatePicker date={startDate} onDateChange={setStartDate} placeholder="Select start date" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Submitted To</label>
                            <DatePicker date={endDate} onDateChange={setEndDate} placeholder="Select end date" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            disabled={loading || exporting}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {exporting ? "Exporting..." : "Export Excel"}
                        </Button>
                        <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                        <Button variant="green" onClick={handleApply} disabled={loading}>
                            {loading ? "Loading..." : "Apply"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Registrations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {!hasAppliedFilters ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>Table is empty by default.</p>
                            <p className="text-sm">Set filters and click Apply to load registrations.</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>No registrations found.</p>
                            <p className="text-sm">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <Table className="min-w-[2000px]">
                                    <TableHeader>
                                        <TableRow className="border-b border-[#3d8f5b]/30 bg-[#3d8f5b]/15 hover:bg-[#3d8f5b]/15">
                                            <TableHead className={tableHeaderCellClass}>Name</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Gender</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Age</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Parent/Guardian</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Relation</TableHead>
                                            <TableHead className={tableHeaderCellClass}>First Language</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Country</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Email</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Phone</TableHead>
                                            <TableHead className={tableHeaderCellClass}>WhatsApp</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Program</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Duration</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[220px]`}>Availability</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Heard About Us</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[240px]`}>Comments</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Submitted</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, index) => (
                                            <TableRow
                                                key={row.id}
                                                className={
                                                    index % 2 === 0
                                                        ? "bg-[#3d8f5b]/5 hover:bg-[#3d8f5b]/15"
                                                        : "bg-[#3d8f5b]/10 hover:bg-[#3d8f5b]/20"
                                                }
                                            >
                                                <TableCell className="font-medium">{row.name}</TableCell>
                                                <TableCell>{display(row.gender)}</TableCell>
                                                <TableCell>{display(row.age)}</TableCell>
                                                <TableCell>{display(row.parent_guardian_name)}</TableCell>
                                                <TableCell>{display(row.relation_to_applicant)}</TableCell>
                                                <TableCell>{display(row.first_language)}</TableCell>
                                                <TableCell>{display(row.country)}</TableCell>
                                                <TableCell>{display(row.email)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{display(row.phone)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{display(row.whatsapp)}</TableCell>
                                                <TableCell>{display(row.program)}</TableCell>
                                                <TableCell>{display(row.class_duration)}</TableCell>
                                                <TableCell className="max-w-[220px]">
                                                    <span className="block truncate" title={row.availability?.join(", ") || "-"}>
                                                        {row.availability?.join(", ") || "-"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{display(row.hear_about_us)}</TableCell>
                                                <TableCell className="max-w-[240px]">
                                                    <span className="block truncate" title={row.comments || "-"}>
                                                        {display(row.comments)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatCreatedAt(row.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                                onPageSizeChange={handlePageSizeChange}
                                totalItems={totalItems}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
