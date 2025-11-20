"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { getProfile } from "@/lib/get/get-profiles"
import { updateProfile, updatePassword } from "@/lib/put/put-profiles"
import { createClient } from "@/utils/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { CountrySelect } from "@/components/country-select"

type ProfileData = {
    first_name: string
    last_name: string
    email: string
    phone: string | null
    gender: string
    country: string
    language: string
    role: string
    status: string
    avatar_url: string | null
}

export default function SettingsPage() {
    const [isMounted, setIsMounted] = useState(false)
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");
    const [country, setCountry] = useState("");
    const [language, setLanguage] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{
        firstName?: string;
        lastName?: string;
        phone?: string;
        gender?: string;
        country?: string;
        language?: string;
        newPassword?: string;
        confirmPassword?: string;
    }>({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getProfile();
                setUserId(data.id);
                setProfile(data);
                setFirstName(data?.first_name || "");
                setLastName(data?.last_name || "");
                setEmail(data?.email || "");
                setPhone(data?.phone || "");
                setGender(data?.gender || "");
                setCountry(data?.country || "");
                setLanguage(data?.language || "");
                setAvatarUrl(data?.avatar_url || null);
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
        setIsMounted(true);
    }, []);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            const file = event.target.files?.[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                setAvatarError('Please upload an image file');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setAvatarError('File size must be less than 5MB');
                return;
            }

            const supabase = createClient();

            // Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `profiles/${userId}/avatar-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(fileName);

            // Update profile with new avatar URL
            if (userId) {
                await updateProfile(userId, {
                    avatar_url: publicUrl
                });
                setAvatarUrl(publicUrl);
            }

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setAvatarError('Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!userId) return;
        try {
            setAvatarError(null);
            await updateProfile(userId, {
                avatar_url: null
            });
            setAvatarUrl(null);
        } catch (error) {
            console.error('Error removing avatar:', error);
            setAvatarError('Failed to remove profile picture. Please try again.');
        }
    };

    const validateFields = () => {
        const errors: typeof fieldErrors = {};

        if (!firstName.trim()) {
            errors.firstName = "First name is required";
        } else if (firstName.trim().length < 2) {
            errors.firstName = "First name must be at least 2 characters";
        } else if (firstName.trim().length > 50) {
            errors.firstName = "First name must be less than 50 characters";
        }

        if (!lastName.trim()) {
            errors.lastName = "Last name is required";
        } else if (lastName.trim().length < 2) {
            errors.lastName = "Last name must be at least 2 characters";
        } else if (lastName.trim().length > 50) {
            errors.lastName = "Last name must be less than 50 characters";
        }

        if (phone && phone.trim()) {
            const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
            if (!phoneRegex.test(phone.trim())) {
                errors.phone = "Please enter a valid phone number";
            }
        }

        if (!gender) {
            errors.gender = "Gender is required";
        }

        if (!country) {
            errors.country = "Country is required";
        }

        if (!language) {
            errors.language = "Language is required";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!userId) return;
        
        if (!validateFields()) {
            return;
        }

        setSaving(true);
        try {
            await updateProfile(userId, {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email,
                phone: phone.trim() || null,
                gender,
                country,
                language,
            });
            // Refresh the page after successful save
            window.location.reload();
        } catch (error) {
            console.error("Failed to update profile:", error);
            setFieldErrors({ ...fieldErrors, firstName: "Failed to update profile. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    const validatePassword = () => {
        const errors: typeof fieldErrors = {};

        if (!currentPassword) {
            setPasswordError("Current password is required");
            return false;
        }

        if (!newPassword) {
            errors.newPassword = "New password is required";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        if (newPassword.length < 8) {
            errors.newPassword = "Password must be at least 8 characters long";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        if (!/(?=.*[a-z])/.test(newPassword)) {
            errors.newPassword = "Password must contain at least one lowercase letter";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        if (!/(?=.*[A-Z])/.test(newPassword)) {
            errors.newPassword = "Password must contain at least one uppercase letter";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        if (!/(?=.*\d)/.test(newPassword)) {
            errors.newPassword = "Password must contain at least one number";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        if (!confirmPassword) {
            errors.confirmPassword = "Please confirm your new password";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
            setFieldErrors({ ...fieldErrors, ...errors });
            return false;
        }

        setFieldErrors({ ...fieldErrors, newPassword: undefined, confirmPassword: undefined });
        return true;
    };

    const handlePasswordUpdate = async () => {
        if (!userId) return;

        // Reset error state
        setPasswordError(null);
        setFieldErrors({ ...fieldErrors, newPassword: undefined, confirmPassword: undefined });

        if (!validatePassword()) {
            return;
        }

        setUpdatingPassword(true);

        try {
            const supabase = createClient();

            // First verify the current password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: currentPassword,
            });

            if (signInError) {
                setPasswordError("Current password is incorrect");
                return;
            }

            // Update the password
            const result = await updatePassword(userId, newPassword);

            if (!result?.success) {
                throw new Error(result?.error || "Failed to update password");
            }

            // Clear the form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Show success message
            alert("Password updated successfully");

        } catch (error) {
            console.error("Failed to update password:", error);
            setPasswordError("Failed to update password. Please try again.");
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (!isMounted || isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full md:w-auto">
                    <TabsTrigger value="general">General</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                            <CardDescription>Update your profile picture</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {avatarError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{avatarError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                                    {avatarUrl ? (
                                        <Image
                                            src={avatarUrl}
                                            alt="Profile picture"
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Upload className="w-4 h-4" />
                                                <span>Upload new picture</span>
                                            </div>
                                        </Label>
                                        {avatarUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRemoveAvatar}
                                                className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                        className="hidden"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Recommended: Square image, max 5MB
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>User Information</CardTitle>
                            <CardDescription>Update your personal details and profile information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first-name">First Name</Label>
                                    <Input
                                        id="first-name"
                                        value={firstName}
                                        onChange={e => {
                                            setFirstName(e.target.value);
                                            if (fieldErrors.firstName) {
                                                setFieldErrors({ ...fieldErrors, firstName: undefined });
                                            }
                                        }}
                                        onBlur={() => {
                                            if (!firstName.trim()) {
                                                setFieldErrors({ ...fieldErrors, firstName: "First name is required" });
                                            } else if (firstName.trim().length < 2) {
                                                setFieldErrors({ ...fieldErrors, firstName: "First name must be at least 2 characters" });
                                            }
                                        }}
                                        className={fieldErrors.firstName ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.firstName && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.firstName}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last-name">Last Name</Label>
                                    <Input
                                        id="last-name"
                                        value={lastName}
                                        onChange={e => {
                                            setLastName(e.target.value);
                                            if (fieldErrors.lastName) {
                                                setFieldErrors({ ...fieldErrors, lastName: undefined });
                                            }
                                        }}
                                        onBlur={() => {
                                            if (!lastName.trim()) {
                                                setFieldErrors({ ...fieldErrors, lastName: "Last name is required" });
                                            } else if (lastName.trim().length < 2) {
                                                setFieldErrors({ ...fieldErrors, lastName: "Last name must be at least 2 characters" });
                                            }
                                        }}
                                        className={fieldErrors.lastName ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.lastName && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.lastName}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-email">Email Address</Label>
                                    <Input
                                        id="user-email"
                                        value={email}
                                        disabled
                                    />
                                    <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-phone">Phone Number</Label>
                                    <Input
                                        id="user-phone"
                                        value={phone}
                                        onChange={e => {
                                            setPhone(e.target.value);
                                            if (fieldErrors.phone) {
                                                setFieldErrors({ ...fieldErrors, phone: undefined });
                                            }
                                        }}
                                        onBlur={() => {
                                            if (phone && phone.trim()) {
                                                const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
                                                if (!phoneRegex.test(phone.trim())) {
                                                    setFieldErrors({ ...fieldErrors, phone: "Please enter a valid phone number" });
                                                }
                                            }
                                        }}
                                        className={fieldErrors.phone ? "border-destructive" : ""}
                                        placeholder="+1234567890"
                                    />
                                    {fieldErrors.phone && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.phone}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-gender">Gender</Label>
                                    <Select 
                                        value={gender || ""} 
                                        onValueChange={(value) => {
                                            setGender(value);
                                            if (fieldErrors.gender) {
                                                setFieldErrors({ ...fieldErrors, gender: undefined });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={fieldErrors.gender ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldErrors.gender && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.gender}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-country">Country</Label>
                                    <CountrySelect 
                                        value={country || ""} 
                                        onValueChange={(value) => {
                                            setCountry(value);
                                            if (fieldErrors.country) {
                                                setFieldErrors({ ...fieldErrors, country: undefined });
                                            }
                                        }}
                                        className={fieldErrors.country ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.country && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.country}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-language">Language</Label>
                                    <Select 
                                        value={language || ""} 
                                        onValueChange={(value) => {
                                            setLanguage(value);
                                            if (fieldErrors.language) {
                                                setFieldErrors({ ...fieldErrors, language: undefined });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className={fieldErrors.language ? "border-destructive" : ""}>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Arabic">Arabic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {fieldErrors.language && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.language}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-role">Role</Label>
                                    <Input
                                        id="user-role"
                                        value={profile?.role || ""}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user-status">Status</Label>
                                    <div>
                                        <Badge
                                            className={`capitalize px-2 py-1 ${profile?.status === "active" ? "bg-green-600"
                                                : profile?.status === "inactive" ? "bg-amber-500"
                                                    : profile?.status === "pending" ? "bg-blue-500"
                                                        : profile?.status === "suspended" ? "bg-red-600"
                                                            : profile?.status === "archived" ? "bg-gray-500"
                                                                : "bg-gray-500"
                                                } `}
                                        >
                                            {profile?.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    backgroundColor: "#3d8f5b",
                                    color: "white",
                                }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Update your security preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {passwordError && (
                                <Alert variant="destructive">
                                    <AlertDescription>{passwordError}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        if (passwordError) {
                                            setPasswordError(null);
                                        }
                                    }}
                                    disabled={updatingPassword}
                                    className={passwordError ? "border-destructive" : ""}
                                />
                                {passwordError && (
                                    <p className="text-[0.8rem] font-medium text-destructive">{passwordError}</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            if (fieldErrors.newPassword) {
                                                setFieldErrors({ ...fieldErrors, newPassword: undefined });
                                            }
                                            if (fieldErrors.confirmPassword && confirmPassword) {
                                                if (e.target.value === confirmPassword) {
                                                    setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                                                } else {
                                                    setFieldErrors({ ...fieldErrors, confirmPassword: "Passwords do not match" });
                                                }
                                            }
                                        }}
                                        onBlur={() => {
                                            if (newPassword) {
                                                if (newPassword.length < 8) {
                                                    setFieldErrors({ ...fieldErrors, newPassword: "Password must be at least 8 characters long" });
                                                } else if (!/(?=.*[a-z])/.test(newPassword)) {
                                                    setFieldErrors({ ...fieldErrors, newPassword: "Password must contain at least one lowercase letter" });
                                                } else if (!/(?=.*[A-Z])/.test(newPassword)) {
                                                    setFieldErrors({ ...fieldErrors, newPassword: "Password must contain at least one uppercase letter" });
                                                } else if (!/(?=.*\d)/.test(newPassword)) {
                                                    setFieldErrors({ ...fieldErrors, newPassword: "Password must contain at least one number" });
                                                }
                                            }
                                        }}
                                        disabled={updatingPassword}
                                        className={fieldErrors.newPassword ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.newPassword && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.newPassword}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Must be at least 8 characters with uppercase, lowercase, and number
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (fieldErrors.confirmPassword) {
                                                if (e.target.value === newPassword) {
                                                    setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                                                } else {
                                                    setFieldErrors({ ...fieldErrors, confirmPassword: "Passwords do not match" });
                                                }
                                            }
                                        }}
                                        onBlur={() => {
                                            if (confirmPassword && newPassword && confirmPassword !== newPassword) {
                                                setFieldErrors({ ...fieldErrors, confirmPassword: "Passwords do not match" });
                                            }
                                        }}
                                        disabled={updatingPassword}
                                        className={fieldErrors.confirmPassword ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.confirmPassword && (
                                        <p className="text-[0.8rem] font-medium text-destructive">{fieldErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handlePasswordUpdate}
                                disabled={updatingPassword}
                                style={{
                                    backgroundColor: "#3d8f5b",
                                    color: "white",
                                }}
                            >
                                {updatingPassword ? "Updating..." : "Update Password"}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
