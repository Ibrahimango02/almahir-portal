import { createClient } from '@/utils/supabase/client'
import { ResourceType } from '@/types'

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

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, file)

    if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName)

    // Create resource record
    const { data, error } = await supabase
        .from('resources')
        .insert({
            title,
            description,
            file_name: file.name,
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
