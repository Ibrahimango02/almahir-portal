"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Calendar, HardDrive, User, BookOpen } from "lucide-react"
import { getResourcesByStudentTeachersWithClassInfo } from "@/lib/get/get-resources"
import { getProfileById } from "@/lib/get/get-profiles"
import { getStudentId } from "@/lib/get/get-students"
import { ResourceType } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/utils/supabase/client"

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

export default function StudentResourcesPage() {
    const [resources, setResources] = useState<ResourceWithUploader[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const { toast } = useToast()

    const fetchResources = useCallback(async () => {
        if (!currentUserId) return

        try {
            // Get the student ID using the profile ID
            const studentId = await getStudentId(currentUserId)

            if (!studentId) {
                console.log("No student record found for profile ID:", currentUserId)
                return
            }

            const data = await getResourcesByStudentTeachersWithClassInfo(studentId)

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
    }, [currentUserId, toast])

    useEffect(() => {
        const getCurrentUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setCurrentUserId(user.id)
            }
        }

        getCurrentUser()
    }, [])

    useEffect(() => {
        if (currentUserId) {
            fetchResources()
        }
    }, [currentUserId, fetchResources])

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

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Resources</h1>
                    <p className="text-muted-foreground">Educational materials shared by your teachers</p>
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
                        <p className="text-muted-foreground mb-6">Your teachers haven&apos;t shared any resources yet</p>
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
