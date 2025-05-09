"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useTheme } from "@/components/theme-provider"
import { MoonIcon, SunIcon, LaptopIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { getProfile } from "@/lib/get/get-profiles"
import { updateProfile, updatePassword } from "@/lib/put/put-profiles"
import { createClient } from "@/utils/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ProfileData = {
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: string
  status: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    setIsMounted(true);
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await updateProfile(userId, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      });
      // Optionally, refetch profile or show a success message
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!userId) return;

    // Reset error state
    setPasswordError(null);

    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
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
        <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
        <p className="text-muted-foreground">Manage your personal account settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
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
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email Address</Label>
                  <Input
                    id="user-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-phone">Phone Number</Label>
                  <Input
                    id="user-phone"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
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
                      className={`capitalize px-2 py-1 ${profile?.status === "active"
                        ? "bg-green-500"
                        : profile?.status === "inactive"
                          ? "bg-amber-500"
                          : profile?.status === "pending"
                            ? "bg-blue-500"
                            : profile?.status === "suspended"
                              ? "bg-red-500"
                              : profile?.status === "archived"
                                ? "bg-gray-500"
                                : "bg-gray-500"
                        }`}
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
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={updatingPassword}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updatingPassword}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updatingPassword}
                  />
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
