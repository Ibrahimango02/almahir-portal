import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
import { getAdmins } from "@/lib/get/get-profiles"
import Link from "next/link"
import { AdminsTable } from "@/components/admins-table"

export default async function AdminsPage() {
    const admins = await getAdmins()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Administrators</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search admins..." className="w-full pl-8" />
                    </div>
                    <Button asChild style={{ backgroundColor: "#3d8f5b", color: "white" }}>
                        <Link href="/admin/admins/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Admin
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>All Administrators</CardTitle>
                    <CardDescription>Manage your administrative staff and their information</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminsTable admins={admins} />
                </CardContent>
            </Card>
        </div>
    )
}
