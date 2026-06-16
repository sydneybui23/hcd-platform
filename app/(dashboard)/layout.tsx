import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FolderOpen, Settings, LogOut } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-gray-50 flex flex-col">
        <div className="p-4 border-b">
          <span className="text-lg font-bold text-blue-600">Compass</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link href="/dashboard/projects" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <FolderOpen className="h-4 w-4" /> Projects
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-gray-500 px-3 mb-2 truncate">{user.email}</p>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 w-full">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
