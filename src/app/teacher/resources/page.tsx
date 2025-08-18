"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, Plus, Upload, Calendar, HardDrive, Trash2, User, BookOpen } from "lucide-react"
import { getResourcesByUserWithClassInfo, getClassesForTeacherResourceUpload } from "@/lib/get/get-resources"
import { createResource } from "@/lib/post/post-resources"
import { deleteResource } from "@/lib/delete/delete-resources"
import { getProfileById } from "@/lib/get/get-profiles"
import { ResourceType } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/utils/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function TeacherResourcesPage() {
    const [resources, setResources] = useState<ResourceWithUploader[]>([])
    const [classes, setClasses] = useState<{ id: string; title: string; subject?: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [resourceToDelete, setResourceToDelete] = useState<ResourceType | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const { toast } = useToast()

    const fetchResources = useCallback(async () => {
        if (!currentUserId) return

        try {
            const data = await getResourcesByUserWithClassInfo(currentUserId)

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

    useEffect(() => {
        const fetchClasses = async () => {
            if (!currentUserId) return
            try {
                const data = await getClassesForTeacherResourceUpload(currentUserId)
                setClasses(data)
            } catch (error) {
                console.error("Error fetching classes:", error)
            }
        }
        fetchClasses()
    }, [currentUserId])

    const handleUpload = async (formData: FormData) => {
        setIsUploading(true)
        try {
            await createResource(formData)
            await fetchResources()
            setIsDialogOpen(false)
            toast({
                title: "Success",
                description: "Resource uploaded successfully",
            })
        } catch {
            toast({
                title: "Error",
                description: "Failed to upload resource",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteClick = (resource: ResourceType) => {
        setResourceToDelete(resource)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!resourceToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteResource(resourceToDelete.resource_id)

            if (result.success) {
                await fetchResources()
                toast({
                    title: "Success",
                    description: `"${resourceToDelete.title}" has been deleted successfully`,
                })
            } else {
                throw new Error(result.error || "Failed to delete resource")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete resource",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
            setDeleteDialogOpen(false)
            setResourceToDelete(null)
        }
    }

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
                    <p className="text-muted-foreground">Manage and organize your educational materials</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="cursor-pointer" style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Upload Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Upload New Resource</DialogTitle>
                        </DialogHeader>
                        <form action={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    required
                                    placeholder="Enter resource title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Brief description of the resource"
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="classId">Class (Required)</Label>
                                <Select name="classId" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((classItem) => (
                                            <SelectItem key={classItem.id} value={classItem.id}>
                                                {classItem.title} {classItem.subject && `(${classItem.subject})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="file">File (PDF)</Label>
                                <Input
                                    id="file"
                                    name="file"
                                    type="file"
                                    accept=".pdf"
                                    required
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isPublic" name="isPublic" value="true" />
                                <Label htmlFor="isPublic">Make this resource public</Label>
                            </div>
                            <Button
                                type="submit"
                                disabled={isUploading}
                                style={{ backgroundColor: "#3d8f5b", color: "white" }}
                                className="w-full cursor-pointer"
                            >
                                {isUploading ? (
                                    <>
                                        <Upload className="h-4 w-4 mr-2 animate-pulse" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload Resource
                                    </>
                                )}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Resource</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{resourceToDelete?.title}&quot;? This action cannot be undone and will permanently remove the resource file and its record from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Resource
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                        <p className="text-muted-foreground mb-6">Upload your first resource to get started</p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            style={{ backgroundColor: "#3d8f5b", color: "white" }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Upload Resource
                        </Button>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(resource.file_url, '_blank')}
                                        className="flex-1 mr-2"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteClick(resource)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
