import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch the user's profile to check their role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    // If not an admin, redirect them
    console.warn('Non-admin user attempted to access admin dashboard.')
    return redirect('/') // Or a '/permission-denied' page
  }

  // Fetch all pending veterinarian profiles
  const { data: pendingVets, error: vetsError } = await supabase
    .from('profiles')
    .select('id, name, email, location, specialization, verification_status')
    .eq('role', 'veterinarian')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (vetsError) {
    console.error('Error fetching pending vets:', vetsError)
    return (
      <div className="p-4 text-center text-red-500">
        <p>Could not fetch pending veterinarians.</p>
      </div>
    )
  }

  // Fetch all users for user management
  const { data: allUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return (
      <div className="p-4 text-center text-red-500">
        <p>Could not fetch users.</p>
      </div>
    )
  }

  // Fetch appointment statistics for admin dashboard
  const { count: totalAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })

  const { count: pendingAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: completedAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: cancelledAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')

  const appointmentStats = {
    total: totalAppointments || 0,
    pending: pendingAppointments || 0,
    completed: completedAppointments || 0,
    cancelled: cancelledAppointments || 0
  }

  return (
    <div className="flex flex-col items-center p-4">
      <AdminDashboard pendingVets={pendingVets} allUsers={allUsers} appointmentStats={appointmentStats} />
    </div>
  )
}
