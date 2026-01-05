import { createClient } from "@/utils/supabase/client"
import { getParentStudents } from "@/lib/get/get-parents"

export async function updateParents(parentId: string, data: {
    status: string;
    student_id: string[];
    notes?: string | null;
    payment_method?: string | null;
    billing_name?: string | null;
    billing_email?: string | null;
    phone?: string | null;
}) {
    const supabase = createClient()

    // Validate input
    if (!parentId) {
        throw new Error('Parent ID is required')
    }

    try {
        // Always update the profile status and phone first
        const profileUpdateData: { status: string; updated_at: string; phone?: string | null } = {
            status: data.status,
            updated_at: new Date().toISOString()
        }
        if (data.phone !== undefined) {
            profileUpdateData.phone = data.phone || null
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdateData)
            .eq('id', parentId)

        if (profileError) {
            throw new Error(`Failed to update profile: ${profileError.message}`)
        }

        // Update notes in the parents table
        if (data.notes !== undefined) {
            // First, check if a parent record exists
            const { data: existingParent } = await supabase
                .from('parents')
                .select('profile_id')
                .eq('profile_id', parentId)
                .single()

            if (existingParent) {
                // Update existing parent record
                const { error: parentError } = await supabase
                    .from('parents')
                    .update({
                        notes: data.notes || null,
                        payment_method: data.payment_method || null,
                        billing_name: data.billing_name || null,
                        billing_email: data.billing_email || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('profile_id', parentId)

                if (parentError) {
                    throw new Error(`Failed to update parent notes: ${parentError.message}`)
                }
            } else {
                // Create parent record if it doesn't exist
                const { error: parentError } = await supabase
                    .from('parents')
                    .insert({
                        profile_id: parentId,
                        notes: data.notes || null,
                        payment_method: data.payment_method || null,
                        billing_name: data.billing_name || null,
                        billing_email: data.billing_email || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })

                if (parentError) {
                    throw new Error(`Failed to create parent record: ${parentError.message}`)
                }
            }
        } else {
            // Even if notes is undefined, we might still need to update payment_method and billing_name
            const { data: existingParent } = await supabase
                .from('parents')
                .select('profile_id')
                .eq('profile_id', parentId)
                .single()

            if (existingParent && (data.payment_method !== undefined || data.billing_name !== undefined || data.billing_email !== undefined)) {
                const updateData: { payment_method?: string | null; billing_name?: string | null; billing_email?: string | null; updated_at: string } = {
                    updated_at: new Date().toISOString()
                }
                if (data.payment_method !== undefined) updateData.payment_method = data.payment_method || null
                if (data.billing_name !== undefined) updateData.billing_name = data.billing_name || null
                if (data.billing_email !== undefined) updateData.billing_email = data.billing_email || null

                const { error: parentError } = await supabase
                    .from('parents')
                    .update(updateData)
                    .eq('profile_id', parentId)

                if (parentError) {
                    throw new Error(`Failed to update parent: ${parentError.message}`)
                }
            }
        }

        // Handle student associations
        // If no students provided, remove all parent associations
        if (!data.student_id || data.student_id.length === 0) {
            // For dependent students, we need to delete the child_profiles and students records
            // For independent students, we just remove the parent association

            // First, get all child profiles for this parent
            const { data: childProfiles, error: fetchError } = await supabase
                .from('child_profiles')
                .select('student_id')
                .eq('parent_profile_id', parentId)

            if (fetchError) {
                throw new Error(`Failed to fetch child profiles: ${fetchError.message}`)
            }

            if (childProfiles && childProfiles.length > 0) {
                const studentIds = childProfiles.map(cp => cp.student_id)

                // Delete the child profiles first
                const { error: deleteChildProfilesError } = await supabase
                    .from('child_profiles')
                    .delete()
                    .eq('parent_profile_id', parentId)

                if (deleteChildProfilesError) {
                    throw new Error(`Failed to delete child profiles: ${deleteChildProfilesError.message}`)
                }

                // Then delete the corresponding students
                const { error: deleteStudentsError } = await supabase
                    .from('students')
                    .delete()
                    .in('id', studentIds)

                if (deleteStudentsError) {
                    throw new Error(`Failed to delete students: ${deleteStudentsError.message}`)
                }
            }
        } else {
            // Get current parent students to compare with new list
            const parentStudents = await getParentStudents(parentId)
            const currentStudentIds = parentStudents?.map(s => s.student_id) || []

            // Find students to remove (in current list but not in new list)
            const studentsToRemove = currentStudentIds.filter(id => !data.student_id.includes(id))

            // Find students to add (in new list but not in current list)
            const studentsToAdd = data.student_id.filter(id => !currentStudentIds.includes(id))

            // Remove parent associations for students no longer in the list
            if (studentsToRemove.length > 0) {
                // For dependent students, we need to delete the child_profiles and students records
                // For independent students, we just remove the parent association

                // First, get the child profiles for students to remove
                const { data: childProfilesToRemove, error: fetchError } = await supabase
                    .from('child_profiles')
                    .select('student_id')
                    .eq('parent_profile_id', parentId)
                    .in('student_id', studentsToRemove)

                if (fetchError) {
                    throw new Error(`Failed to fetch child profiles for removal: ${fetchError.message}`)
                }

                if (childProfilesToRemove && childProfilesToRemove.length > 0) {
                    const studentIdsToDelete = childProfilesToRemove.map(cp => cp.student_id)

                    // Delete the child profiles first
                    const { error: deleteChildProfilesError } = await supabase
                        .from('child_profiles')
                        .delete()
                        .eq('parent_profile_id', parentId)
                        .in('student_id', studentsToRemove)

                    if (deleteChildProfilesError) {
                        throw new Error(`Failed to delete child profiles: ${deleteChildProfilesError.message}`)
                    }

                    // Then delete the corresponding students
                    const { error: deleteStudentsError } = await supabase
                        .from('students')
                        .delete()
                        .in('id', studentIdsToDelete)

                    if (deleteStudentsError) {
                        throw new Error(`Failed to delete students: ${deleteStudentsError.message}`)
                    }
                }
            }

            // Add parent associations for new students
            if (studentsToAdd.length > 0) {
                // First, check which students already have child_profiles
                const { data: existingChildProfiles } = await supabase
                    .from('child_profiles')
                    .select('id, student_id, parent_profile_id')
                    .in('student_id', studentsToAdd)

                const existingStudentIds = existingChildProfiles?.map(cp => cp.student_id) || []
                const newStudentIds = studentsToAdd.filter(id => !existingStudentIds.includes(id))

                // Update existing child_profiles that don't have a parent
                const existingWithoutParent = existingChildProfiles?.filter(cp => !cp.parent_profile_id) || []
                if (existingWithoutParent.length > 0) {
                    const { error } = await supabase
                        .from('child_profiles')
                        .update({
                            parent_profile_id: parentId,
                            updated_at: new Date().toISOString()
                        })
                        .in('id', existingWithoutParent.map(cp => cp.id))

                    if (error) {
                        throw new Error(`Failed to update existing child profiles: ${error.message}`)
                    }
                }

                // Create new child_profiles for students that don't have them
                if (newStudentIds.length > 0) {
                    const newChildProfiles = newStudentIds.map(studentId => ({
                        student_id: studentId,
                        parent_profile_id: parentId,
                        first_name: '', // These will need to be filled in separately
                        last_name: '',   // These will need to be filled in separately
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }))

                    const { error } = await supabase
                        .from('child_profiles')
                        .insert(newChildProfiles)

                    if (error) {
                        throw new Error(`Failed to create new child profiles: ${error.message}`)
                    }
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error('Error in updateParents:', error)
        throw error
    }
}
