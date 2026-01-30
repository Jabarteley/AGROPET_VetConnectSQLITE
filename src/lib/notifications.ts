'use server'

import { revalidatePath } from 'next/cache'
import { notificationOperations, appointmentOperations, profileOperations } from '@/lib/dbOperations'

export async function createNotification(userId: string, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' | 'appointment_reminder' = 'info') {
  try {
    const newNotification = notificationOperations.create({
      user_id: userId,
      title,
      message,
      type,
      is_read: false
    })

    // Revalidate the relevant pages
    revalidatePath('/profile') // or wherever notifications are displayed

    return { data: newNotification }
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return { error: error.message || 'Database error: Could not create notification.' }
  }
}

export async function scheduleAppointmentReminders() {
  try {
    // Get appointments that are scheduled for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString()
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString()

    // Get all appointments
    const allAppointments = appointmentOperations.getAll() || []

    // Filter appointments for tomorrow that are approved
    const appointments = allAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_datetime)
      return (
        appointmentDate >= new Date(tomorrowStart) &&
        appointmentDate < new Date(tomorrowEnd) &&
        appointment.status === 'approved'
      )
    })

    if (!appointments || appointments.length === 0) {
      return { message: 'No appointments found for tomorrow.' }
    }

    // Create reminder notifications for each appointment
    for (const appointment of appointments) {
      // Get client profile to get name
      const clientProfile = profileOperations.getById(appointment.user_id)

      // Send reminder to client
      await createNotification(
        appointment.user_id,
        'Appointment Reminder',
        `You have an appointment tomorrow at ${new Date(appointment.appointment_datetime).toLocaleString()}.`,
        'appointment_reminder'
      )

      // Send reminder to veterinarian
      await createNotification(
        appointment.vet_id,
        'Appointment Reminder',
        `You have an appointment tomorrow with ${clientProfile?.name || 'a client'} at ${new Date(appointment.appointment_datetime).toLocaleString()}.`,
        'appointment_reminder'
      )
    }

    return { message: `Scheduled reminders for ${appointments.length} appointments.` }
  } catch (error: any) {
    console.error('Error scheduling appointment reminders:', error)
    return { error: error.message || 'Database error: Could not fetch appointments for reminders.' }
  }
}