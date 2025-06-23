"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import Image from "next/image"

type UserProfile = {
    id: string
    email: string
    first_name?: string
    last_name?: string
    avatar_url?: string
    role?: string
}

export default function TestPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true)
            const supabase = createClient()
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                setProfile(null)
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (error) {
                setProfile({
                    id: user.id,
                    email: user.email || "",
                })
            } else {
                setProfile({
                    id: user.id,
                    email: user.email || "",
                    ...data,
                })
            }
            setLoading(false)
        }

        fetchProfile()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <p>Loading user info...</p>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <p>No user is currently logged in.</p>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md dark:bg-gray-900">
            <h1 className="text-2xl font-bold mb-4">Current User Info</h1>
            <div className="flex items-center gap-4 mb-4">
                {profile.avatar_url ? (
                    <Image
                        src={profile.avatar_url}
                        alt="User Avatar"
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
                        {profile.first_name?.[0] || profile.email[0]}
                    </div>
                )}
                <div>
                    <p className="text-lg font-medium">
                        {profile.first_name || ""} {profile.last_name || ""}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                </div>
            </div>
            <div>
                <p>
                    <span className="font-semibold">User ID:</span> {profile.id}
                </p>
                {profile.role && (
                    <p>
                        <span className="font-semibold">Role:</span> {profile.role}
                    </p>
                )}
            </div>
        </div>
    )
}
