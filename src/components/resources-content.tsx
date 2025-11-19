"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Calendar, HardDrive, User, BookOpen } from "lucide-react"
import { getResourcesByParentStudentsTeachersWithClassInfo, getResourcesByStudentId } from "@/lib/get/get-resources"
import { getProfileById } from "@/lib/get/get-profiles"
import { ResourceType } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useStudentSwitcher } from "@/contexts/StudentSwitcherContext"

type ResourceWithUploader = ResourceType & {
    uploader?: {
        first_name: string
        last_name: string
    }
    class?: {
        title: string
        subject?: string
    }
}

interface ResourcesContentProps {
    currentUserId: string
}

export function ResourcesContent({ currentUserId }: ResourcesContentProps) {
    const { selectedStudent, isParentView } = useStudentSwitcher()
    const [resources, setResources] = useState<ResourceWithUploader[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    const fetchResources = useCallback(async () => {
        try {
            setIsLoading(true)
            let data: (ResourceType & { class?: { title: string; subject?: string } })[]

            if (isParentView) {
                // Parent view: get resources for all children
                data = await getResourcesByParentStudentsTeachersWithClassInfo(currentUserId)
            } else if (selectedStudent) {
                // Student view: get resources for specific student
                data = await getResourcesByStudentId(selectedStudent.student_id)
            } else {
                data = []
            }

            // Fetch uploader information for each resource
            const resourcesWithUploaders = await Promise.all(
                data.map(async (resource) => {
                    if (resource.uploaded_by) {
                        try {
                            const profile = await getProfileById(resource.uploaded_by)
                            return {
                                ...resource,
                                uploader: {
                                    first_name: profile.first_name,
                                    last_name: profile.last_name
                                }
                            }
                        } catch {
                            console.error(`Failed to fetch uploader for resource ${resource.resource_id}`)
                            return resource
                        }
                    }
                    return resource
                })
            )

            setResources(resourcesWithUploaders)
        } catch {
            toast({
                title: "Error",
                description: "Failed to fetch resources",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }, [currentUserId, selectedStudent, isParentView, toast])

    useEffect(() => {
        fetchResources()
    }, [fetchResources])

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const ResourceCardSkeleton = () => (
        <Card className="h-64">
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-9 w-full" />
            </CardContent>
        </Card>
    )

    // Determine the title and description based on the current view
    const currentTitle = "Resources"

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{currentTitle}</h1>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <ResourceCardSkeleton key={i} />
                    ))}
                </div>
            ) : resources.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No resources available</h3>
                        <p className="text-muted-foreground mb-6">
                            There are no resources to display. Resources will appear here once they are shared by teachers.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {resources.map((resource) => (
                        <Card key={resource.resource_id} className="group hover:shadow-md transition-all duration-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <span className="line-clamp-2">{resource.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {resource.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {resource.description}
                                    </p>
                                )}

                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <HardDrive className="h-3 w-3" />
                                        <span>{formatFileSize(resource.file_size || 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {resource.uploader && (
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3" />
                                            <span>Uploaded by {resource.uploader.first_name} {resource.uploader.last_name}</span>
                                        </div>
                                    )}
                                    {resource.class && (
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="h-3 w-3" />
                                            <span>{resource.class.title} {resource.class.subject && `(${resource.class.subject})`}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        onClick={() => window.open(resource.file_url, '_blank')}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
} 