"use client"

import { useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { CalendarDays, Check, ChevronDown, Download, Filter, Search, Wrench, X } from "lucide-react"
import * as XLSX from "xlsx"
import {
    AdminClassSessionsToolFilters,
    AdminClassSessionsToolOption,
    AdminClassSessionsToolRow,
} from "@/types"
import { getClassSessionsToolData } from "@/lib/get/get-admin-tools"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { TablePagination } from "@/components/table-pagination"

function formatDateValue(date: Date): string {
    return format(date, "yyyy-MM-dd")
}

const SESSION_DISPLAY_TIMEZONE = "America/Toronto"

function formatTimeOnly(value: string | null): string {
    if (!value) return "-"
    try {
        return formatInTimeZone(parseISO(value), SESSION_DISPLAY_TIMEZONE, "hh:mm a")
    } catch {
        return value
    }
}

function formatDateOnly(value: string): string {
    try {
        return formatInTimeZone(parseISO(value), SESSION_DISPLAY_TIMEZONE, "MMM d, yyyy")
    } catch {
        return value
    }
}

function formatRates(rates: number[], currencies: (string | null)[]): string {
    if (rates.length === 0) return "-"
    return rates
        .map((rate, index) => {
            const currency = currencies[index]
            return currency ? `${rate.toFixed(2)} ${currency}` : rate.toFixed(2)
        })
        .join(", ")
}

function getNamesSummary(names: string[]): { primary: string; extra: string | null } {
    if (names.length === 0) return { primary: "-", extra: null }
    if (names.length === 1) return { primary: names[0], extra: null }
    return { primary: names[0], extra: `+${names.length - 1} more` }
}

function formatAmount(amount: number | null, currencies: (string | null)[]): string {
    if (amount === null) return "-"
    const uniqueCurrencies = [...new Set(currencies.filter((currency): currency is string => Boolean(currency)))]
    if (uniqueCurrencies.length === 0) return amount.toFixed(2)
    if (uniqueCurrencies.length === 1) return `${amount.toFixed(2)} ${uniqueCurrencies[0]}`
    return `${amount.toFixed(2)} ${uniqueCurrencies.join("/")}`
}

const tableHeaderCellClass = "text-[13px] font-semibold text-[#1f5133] whitespace-nowrap leading-5"

type SearchSelectProps = {
    label: string
    value: string
    onValueChange: (value: string) => void
    options: AdminClassSessionsToolOption[]
    allLabel: string
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    disabled?: boolean
}

const sessionStatusOptions: AdminClassSessionsToolOption[] = [
    { id: "scheduled", label: "Scheduled" },
    { id: "running", label: "Running" },
    { id: "pending", label: "Pending" },
    { id: "complete", label: "Complete" },
    { id: "absence", label: "Absence" },
    { id: "cancelled", label: "Cancelled" },
    { id: "rescheduled", label: "Rescheduled" },
]

type MultiSearchSelectProps = {
    label: string
    values: string[]
    onValuesChange: (values: string[]) => void
    options: AdminClassSessionsToolOption[]
    allLabel: string
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    disabled?: boolean
}

function SearchSelect({
    label,
    value,
    onValueChange,
    options,
    allLabel,
    placeholder,
    searchPlaceholder,
    emptyText,
    disabled = false,
}: SearchSelectProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const dropdownId = `search-select-${label.toLowerCase().replace(/\s+/g, "-")}`

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options
        const searchLower = searchValue.toLowerCase()
        return options.filter((option) => option.label.toLowerCase().includes(searchLower))
    }, [options, searchValue])

    const selectedLabel = useMemo(() => {
        if (value === "all") return allLabel
        return options.find((option) => option.id === value)?.label || placeholder
    }, [allLabel, options, placeholder, value])

    useEffect(() => {
        setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
    }, [searchValue, filteredOptions.length])

    useEffect(() => {
        if (!open) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            const root = document.getElementById(dropdownId)
            if (!root?.contains(target)) {
                setOpen(false)
                setSearchValue("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [dropdownId, open])

    const handleSelect = (newValue: string) => {
        onValueChange(newValue)
        setOpen(false)
        setSearchValue("")
    }

    return (
        <div className="space-y-2" id={dropdownId}>
            <label className="text-sm font-medium">{label}</label>
            <div className="relative">
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-white",
                        !selectedLabel && "text-muted-foreground"
                    )}
                    disabled={disabled}
                    onClick={() => setOpen((current) => !current)}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {open && !disabled && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border bg-white shadow-md">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    autoFocus
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Escape") {
                                            setOpen(false)
                                            setSearchValue("")
                                        }
                                        if (event.key === "ArrowDown") {
                                            event.preventDefault()
                                            setHighlightedIndex((current) =>
                                                filteredOptions.length === 0
                                                    ? -1
                                                    : (current + 1 + filteredOptions.length) % filteredOptions.length
                                            )
                                        }
                                        if (event.key === "ArrowUp") {
                                            event.preventDefault()
                                            setHighlightedIndex((current) =>
                                                filteredOptions.length === 0
                                                    ? -1
                                                    : (current - 1 + filteredOptions.length) % filteredOptions.length
                                            )
                                        }
                                        if (event.key === "Enter" && highlightedIndex >= 0) {
                                            event.preventDefault()
                                            handleSelect(filteredOptions[highlightedIndex].id)
                                        }
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="pl-8 pr-8"
                                />
                                {searchValue && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchValue("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto">
                            <button
                                type="button"
                                className={cn(
                                    "w-full px-3 py-2 text-left text-sm hover:bg-muted/50",
                                    value === "all" && "bg-muted/40 font-medium"
                                )}
                                onClick={() => handleSelect("all")}
                            >
                                {allLabel}
                            </button>

                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</div>
                            ) : (
                                filteredOptions.map((option, index) => (
                                    <button
                                        type="button"
                                        key={option.id}
                                        className={cn(
                                            "w-full px-3 py-2 text-left text-sm hover:bg-muted/50",
                                            value === option.id && "bg-muted/40 font-medium",
                                            highlightedIndex === index && "bg-muted/30"
                                        )}
                                        onClick={() => handleSelect(option.id)}
                                    >
                                        {option.label}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function MultiSearchSelect({
    label,
    values,
    onValuesChange,
    options,
    allLabel,
    placeholder,
    searchPlaceholder,
    emptyText,
    disabled = false,
}: MultiSearchSelectProps) {
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const dropdownId = `multi-search-select-${label.toLowerCase().replace(/\s+/g, "-")}`

    const filteredOptions = useMemo(() => {
        if (!searchValue) return options
        const searchLower = searchValue.toLowerCase()
        return options.filter((option) => option.label.toLowerCase().includes(searchLower))
    }, [options, searchValue])

    const selectedLabel = useMemo(() => {
        if (values.length === 0) return allLabel || placeholder
        if (values.length === 1) {
            return options.find((option) => option.id === values[0])?.label || placeholder
        }
        return `${values.length} statuses selected`
    }, [allLabel, options, placeholder, values])

    useEffect(() => {
        if (!open) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            const root = document.getElementById(dropdownId)
            if (!root?.contains(target)) {
                setOpen(false)
                setSearchValue("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [dropdownId, open])

    const toggleValue = (value: string) => {
        if (values.includes(value)) {
            onValuesChange(values.filter((current) => current !== value))
        } else {
            onValuesChange([...values, value])
        }
    }

    return (
        <div className="space-y-2" id={dropdownId}>
            <label className="text-sm font-medium">{label}</label>
            <div className="relative">
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between bg-white",
                        !selectedLabel && "text-muted-foreground"
                    )}
                    disabled={disabled}
                    onClick={() => setOpen((current) => !current)}
                >
                    <span className="truncate">{selectedLabel}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>

                {open && !disabled && (
                    <div className="absolute z-50 w-full mt-1 rounded-md border bg-white shadow-md">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    autoFocus
                                    value={searchValue}
                                    onChange={(event) => setSearchValue(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Escape") {
                                            setOpen(false)
                                            setSearchValue("")
                                        }
                                    }}
                                    placeholder={searchPlaceholder}
                                    className="pl-8 pr-8"
                                />
                                {searchValue && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchValue("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto">
                            <button
                                type="button"
                                className={cn(
                                    "w-full px-3 py-2 text-left text-sm hover:bg-muted/50",
                                    values.length === 0 && "bg-muted/40 font-medium"
                                )}
                                onClick={() => onValuesChange([])}
                            >
                                {allLabel}
                            </button>

                            {filteredOptions.length === 0 ? (
                                <div className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = values.includes(option.id)
                                    return (
                                        <button
                                            type="button"
                                            key={option.id}
                                            className={cn(
                                                "w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center justify-between",
                                                isSelected && "bg-muted/40 font-medium"
                                            )}
                                            onClick={() => toggleValue(option.id)}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function AdminClassSessionsTool() {
    const [rows, setRows] = useState<AdminClassSessionsToolRow[]>([])
    const [totalItems, setTotalItems] = useState(0)
    const [classOptions, setClassOptions] = useState<AdminClassSessionsToolOption[]>([])
    const [teacherOptions, setTeacherOptions] = useState<AdminClassSessionsToolOption[]>([])
    const [studentOptions, setStudentOptions] = useState<AdminClassSessionsToolOption[]>([])
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [loadingOptions, setLoadingOptions] = useState(true)
    const [hasAppliedFilters, setHasAppliedFilters] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [classId, setClassId] = useState<string>("all")
    const [teacherId, setTeacherId] = useState<string>("all")
    const [studentId, setStudentId] = useState<string>("all")
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [endDate, setEndDate] = useState<Date | undefined>()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(100)

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                setLoadingOptions(true)
                const data = await getClassSessionsToolData({}, { includeRows: false })
                setClassOptions(data.classOptions)
                setTeacherOptions(data.teacherOptions)
                setStudentOptions(data.studentOptions)
            } catch (fetchError) {
                console.error("Error loading class session tool options:", fetchError)
                setError("Failed to load filters")
            } finally {
                setLoadingOptions(false)
            }
        }

        fetchOptions()
    }, [])

    const normalizedFilters = useMemo<AdminClassSessionsToolFilters>(() => {
        return {
            classId: classId !== "all" ? classId : undefined,
            teacherId: teacherId !== "all" ? teacherId : undefined,
            studentId: studentId !== "all" ? studentId : undefined,
            statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
            startDate: startDate ? formatDateValue(startDate) : undefined,
            endDate: endDate ? formatDateValue(endDate) : undefined,
        }
    }, [classId, teacherId, studentId, selectedStatuses, startDate, endDate])

    const fetchRows = async (page = currentPage, perPage = pageSize, markApplied = true) => {
        try {
            setLoading(true)
            setError(null)
            const data = await getClassSessionsToolData(normalizedFilters, {
                page,
                pageSize: perPage,
            })
            setRows(data.rows)
            setTotalItems(data.totalItems)
            if (markApplied) {
                setHasAppliedFilters(true)
            }
        } catch (fetchError) {
            console.error("Error loading class sessions rows:", fetchError)
            setError("Failed to load class sessions")
            setRows([])
            setTotalItems(0)
            if (markApplied) {
                setHasAppliedFilters(true)
            }
        } finally {
            setLoading(false)
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

    const handleApply = async () => {
        const nextPage = 1
        setCurrentPage(nextPage)
        await fetchRows(nextPage, pageSize, true)
    }

    const handlePageChange = async (page: number) => {
        setCurrentPage(page)
        await fetchRows(page, pageSize, false)
    }

    const handlePageSizeChange = async (newPageSize: number) => {
        const nextPage = 1
        setPageSize(newPageSize)
        setCurrentPage(nextPage)
        await fetchRows(nextPage, newPageSize, false)
    }

    const handleExportExcel = async () => {
        try {
            setExporting(true)
            setError(null)

            const exportPageSize = 500
            let exportPage = 1
            let total = 0
            let collectedRows: AdminClassSessionsToolRow[] = []

            do {
                const data = await getClassSessionsToolData(normalizedFilters, {
                    page: exportPage,
                    pageSize: exportPageSize,
                })
                total = data.totalItems
                collectedRows = [...collectedRows, ...data.rows]
                exportPage += 1
            } while (collectedRows.length < total)

            const worksheetRows = collectedRows.map((row) => ({
                "Class Name": row.class_name,
                "Teacher(s)": row.teacher_names.join(", "),
                "Student(s)": row.student_names.join(", "),
                "Hourly Rate": formatRates(row.teacher_hourly_rates, row.teacher_hourly_rate_currencies),
                "Session Date": formatDateOnly(row.session_date),
                "Start Time": formatTimeOnly(row.session_date),
                Duration: row.duration || "-",
                Status: row.status || "-",
                Amount: formatAmount(row.amount, row.teacher_hourly_rate_currencies),
                "Actual Start": formatTimeOnly(row.actual_start_time),
                "Actual End": formatTimeOnly(row.actual_end_time),
            }))

            const worksheet = XLSX.utils.json_to_sheet(worksheetRows)
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "class_sessions")

            const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm")
            XLSX.writeFile(workbook, `class_sessions_${timestamp}.xlsx`)
        } catch (exportError) {
            console.error("Error exporting class sessions:", exportError)
            setError("Failed to export class sessions")
        } finally {
            setExporting(false)
        }
    }

    const clearFilters = () => {
        setClassId("all")
        setTeacherId("all")
        setStudentId("all")
        setSelectedStatuses([])
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Tools</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Tool: class_sessions
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <SearchSelect
                            label="Class"
                            value={classId}
                            onValueChange={setClassId}
                            options={classOptions}
                            allLabel="All classes"
                            placeholder="Select class"
                            searchPlaceholder="Search classes..."
                            emptyText="No classes found"
                            disabled={loadingOptions}
                        />

                        <SearchSelect
                            label="Teacher"
                            value={teacherId}
                            onValueChange={setTeacherId}
                            options={teacherOptions}
                            allLabel="All teachers"
                            placeholder="Select teacher"
                            searchPlaceholder="Search teachers..."
                            emptyText="No teachers found"
                            disabled={loadingOptions}
                        />

                        <SearchSelect
                            label="Student"
                            value={studentId}
                            onValueChange={setStudentId}
                            options={studentOptions}
                            allLabel="All students"
                            placeholder="Select student"
                            searchPlaceholder="Search students..."
                            emptyText="No students found"
                            disabled={loadingOptions}
                        />

                        <MultiSearchSelect
                            label="Session Status"
                            values={selectedStatuses}
                            onValuesChange={setSelectedStatuses}
                            options={sessionStatusOptions}
                            allLabel="All statuses"
                            placeholder="Select status"
                            searchPlaceholder="Search statuses..."
                            emptyText="No statuses found"
                            disabled={loadingOptions}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Date</label>
                            <DatePicker
                                date={startDate}
                                onDateChange={setStartDate}
                                placeholder="Select start date"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Date</label>
                            <DatePicker
                                date={endDate}
                                onDateChange={setEndDate}
                                placeholder="Select end date"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            disabled={loading || loadingOptions || exporting}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {exporting ? "Exporting..." : "Export Excel"}
                        </Button>
                        <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
                            <X className="h-4 w-4" />
                            Clear
                        </Button>
                        <Button variant="green" onClick={handleApply} disabled={loading || loadingOptions}>
                            {loading ? "Loading..." : "Apply"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        Class Sessions
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
                            <p className="text-sm">Set filters and click Apply to load class sessions.</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Wrench className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>No class sessions found.</p>
                            <p className="text-sm">Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                All session dates and times are shown in {SESSION_DISPLAY_TIMEZONE}.
                            </p>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[1600px]">
                                    <TableHeader>
                                        <TableRow className="border-b border-[#3d8f5b]/30 bg-[#3d8f5b]/15 hover:bg-[#3d8f5b]/15">
                                            <TableHead className={`${tableHeaderCellClass} w-[170px]`}>Class Name</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[170px]`}>Teacher(s)</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[170px]`}>Student(s)</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[140px]`}>Hourly Rate</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[140px]`}>Session Date</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[110px]`}>Start Time</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Duration</TableHead>
                                            <TableHead className={tableHeaderCellClass}>Status</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[100px]`}>Amount</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[110px]`}>Actual Start</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[110px]`}>Actual End</TableHead>
                                            <TableHead className={`${tableHeaderCellClass} w-[280px]`}>Session Summary</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, index) => (
                                            <TableRow
                                                key={row.session_id}
                                                className={
                                                    index % 2 === 0
                                                        ? "bg-[#3d8f5b]/5 hover:bg-[#3d8f5b]/15"
                                                        : "bg-[#3d8f5b]/10 hover:bg-[#3d8f5b]/20"
                                                }
                                            >
                                                <TableCell>{row.class_name}</TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const summary = getNamesSummary(row.teacher_names)
                                                        return (
                                                            <span>
                                                                {summary.primary}
                                                                {summary.extra && (
                                                                    <span className="ml-1 text-xs text-muted-foreground">
                                                                        {summary.extra}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const summary = getNamesSummary(row.student_names)
                                                        return (
                                                            <span>
                                                                {summary.primary}
                                                                {summary.extra && (
                                                                    <span className="ml-1 text-xs text-muted-foreground">
                                                                        {summary.extra}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        )
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {formatRates(row.teacher_hourly_rates, row.teacher_hourly_rate_currencies)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">{formatDateOnly(row.session_date)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{formatTimeOnly(row.session_date)}</TableCell>
                                                <TableCell>{row.duration || "-"}</TableCell>
                                                <TableCell>{row.status || "-"}</TableCell>
                                                <TableCell>{formatAmount(row.amount, row.teacher_hourly_rate_currencies)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{formatTimeOnly(row.actual_start_time)}</TableCell>
                                                <TableCell className="whitespace-nowrap">{formatTimeOnly(row.actual_end_time)}</TableCell>
                                                <TableCell className="max-w-[280px]">
                                                    <span className="block truncate" title={row.session_summary || "-"}>
                                                        {row.session_summary || "-"}
                                                    </span>
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
