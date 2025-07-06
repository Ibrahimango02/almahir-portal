import { createClient } from '@/utils/supabase/client'
import { ResourceType } from '@/types'

// Helper function to sanitize filename for storage
function sanitizeFileName(fileName: string): string {
    // Remove or replace problematic characters
    return fileName
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Keep only alphanumeric, dots, underscores, and hyphens
        .toLowerCase() // Convert to lowercase
}

export async function createResource(formData: FormData): Promise<ResourceType> {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true'

    if (!file) {
        throw new Error('No file provided')
    }

    // Upload file to Supabase Storage with sanitized filename
    const originalFileName = file.name
    const fileExtension = originalFileName.split('.').pop() || ''
    const sanitizedFileName = sanitizeFileName(originalFileName.replace(`.${fileExtension}`, ''))
    const storageFileName = `${Date.now()}-${sanitizedFileName}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(storageFileName, file)

    if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(storageFileName)

    // Create resource record
    const { data, error } = await supabase
        .from('resources')
        .insert({
            title,
            description,
            file_name: originalFileName, // Store the original filename
            file_url: publicUrl,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id,
            is_public: isPublic
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create resource: ${error.message}`)
    }

    return data
}
