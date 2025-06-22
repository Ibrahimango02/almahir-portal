import { createClient } from "@/utils/supabase/client"

export async function deleteResource(resourceId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    try {
        // First, get the resource details to extract the file name from the URL
        const { data: resource, error: fetchError } = await supabase
            .from('resources')
            .select('file_url')
            .eq('resource_id', resourceId)
            .single()

        if (fetchError) {
            console.error('Error fetching resource:', fetchError)
            return { success: false, error: `Failed to fetch resource: ${fetchError.message}` }
        }

        if (!resource) {
            return { success: false, error: 'Resource not found' }
        }

        // Extract file name from the URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/resources/filename
        const urlParts = resource.file_url.split('/')
        const fileName = urlParts[urlParts.length - 1]

        // Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from('resources')
            .remove([fileName])

        if (storageError) {
            console.error('Error deleting file from storage:', storageError)
            return { success: false, error: `Failed to delete file from storage: ${storageError.message}` }
        }

        // Delete the resource record from the database
        const { error: deleteError } = await supabase
            .from('resources')
            .delete()
            .eq('resource_id', resourceId)

        if (deleteError) {
            console.error('Error deleting resource record:', deleteError)
            return { success: false, error: `Failed to delete resource record: ${deleteError.message}` }
        }

        return { success: true }
    } catch (error) {
        console.error('Unexpected error in deleteResource:', error)
        return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
} 