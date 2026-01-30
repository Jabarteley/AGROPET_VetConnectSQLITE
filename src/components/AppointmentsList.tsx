'use client'

import { useState } from 'react'
import { updateAppointmentStatus } from '@/app/appointments/actions'
import VetAppointmentActions from '@/components/VetAppointmentActions'

// Define the type for the enriched appointment
export type EnrichedAppointment = {
  id: string
  user_id: string
  vet_id: string
  appointment_datetime: string
  status: string
  reason?: string
  images?: string | null
  diagnosis?: string | null
  prescription?: string | null
  vet_comments?: string | null
  created_at: string
  updated_at?: string
  client_name: string
  vet_name: string
  client_photo?: string | null
  vet_photo?: string | null
}

type CurrentUser = {
  id: string
  role: 'farmer_pet_owner' | 'veterinarian' | 'admin' | undefined
}

export default function AppointmentsList({
  initialAppointments,
  currentUser,
}: {
  initialAppointments: EnrichedAppointment[]
  currentUser: CurrentUser
}) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusUpdate = async (appointmentId: string, newStatus: 'approved' | 'cancelled' | 'completed') => {
    setLoading(true)
    setError(null)

    const result = await updateAppointmentStatus(appointmentId, newStatus)

    if (result.error) {
      setError(result.error)
    } else {
      // Update the status of the appointment in the local state
      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId ? { ...appt, status: newStatus } : appt
        )
      )
    }
    setLoading(false)
  }

  const handleAppointmentUpdate = (updatedAppointment: EnrichedAppointment) => {
    setAppointments(prev =>
      prev.map(appt =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );
  };

  const isVet = currentUser.role === 'veterinarian'

  const clientAppointments = appointments.filter((appt) => appt.user_id === currentUser.id)
  const vetAppointments = isVet ? appointments.filter((appt) => appt.vet_id === currentUser.id) : []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const parseImages = (imagesJson: string | null) => {
    if (!imagesJson) return [];
    try {
      return JSON.parse(imagesJson);
    } catch (e) {
      console.error('Error parsing images JSON:', e);
      return [];
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Diagnostic message to show the current user's role */}
      <div className="p-4 bg-gray-100 border rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Dashboard Info:</strong> Viewing as role: <span className="font-semibold text-indigo-600">{currentUser.role || 'Not defined'}</span>
        </p>
      </div>

      {/* Appointments booked by the user */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">My Bookings</h2>
        {clientAppointments.length > 0 ? (
          <div className="space-y-4">
            {clientAppointments.map((appt) => (
              <div key={`client-${appt.id}`} className="bg-white p-4 rounded-lg shadow-md border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <p>
                    <strong>Veterinarian:</strong> {appt.vet_name}
                  </p>
                  <p>
                    <strong>Date:</strong> {formatDate(appt.appointment_datetime)}
                  </p>
                  <p>
                    <strong>Status:</strong> <span className={`font-semibold ${
                      appt.status === 'approved' ? 'text-green-600' :
                      appt.status === 'completed' ? 'text-blue-600' :
                      appt.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>{appt.status}</span>
                  </p>
                </div>

                {/* Show reason and images for client appointments */}
                {appt.reason && (
                  <div className="mt-2">
                    <p><strong>Reason:</strong> {appt.reason}</p>
                  </div>
                )}

                {appt.images && parseImages(appt.images).length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Supporting Images:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {parseImages(appt.images).map((imageUrl: string, idx: number) => (
                        <a key={idx} href={imageUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={imageUrl}
                            alt={`Supporting image ${idx + 1}`}
                            className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-90"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show diagnosis, prescription, and comments when appointment is completed */}
                {appt.status === 'completed' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">Appointment Outcome</h3>
                    {appt.diagnosis && (
                      <div className="mb-2">
                        <p><strong>Diagnosis:</strong> {appt.diagnosis}</p>
                      </div>
                    )}
                    {appt.prescription && (
                      <div className="mb-2">
                        <p><strong>Prescription:</strong> {appt.prescription}</p>
                      </div>
                    )}
                    {appt.vet_comments && (
                      <div className="mb-2">
                        <p><strong>Comments:</strong> {appt.vet_comments}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have not booked any appointments.</p>
        )}
      </div>

      {/* Appointments for the veterinarian */}
      {isVet && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Client Requests</h2>
          {vetAppointments.length > 0 ? (
            <div className="space-y-4">
              {vetAppointments.map((appt) => (
                <div key={`vet-${appt.id}`} className="bg-white p-4 rounded-lg shadow-md border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p>
                      <strong>Client:</strong> {appt.client_name}
                    </p>
                    <p>
                      <strong>Date:</strong> {formatDate(appt.appointment_datetime)}
                    </p>
                    <p>
                      <strong>Status:</strong> <span className={`font-semibold ${
                        appt.status === 'approved' ? 'text-green-600' :
                        appt.status === 'completed' ? 'text-blue-600' :
                        appt.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'}`}>{appt.status}</span>
                    </p>
                  </div>

                  {/* Show reason and images for vet appointments */}
                  {appt.reason && (
                    <div className="mt-2">
                      <p><strong>Reason:</strong> {appt.reason}</p>
                    </div>
                  )}

                  {appt.images && parseImages(appt.images).length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Supporting Images:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {parseImages(appt.images).map((imageUrl: string, idx: number) => (
                          <a key={idx} href={imageUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={imageUrl}
                              alt={`Supporting image ${idx + 1}`}
                              className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-90"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {appt.status === 'pending' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleStatusUpdate(appt.id, 'approved')}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {(appt.status === 'approved' || appt.status === 'completed') && (
                    <VetAppointmentActions
                      appointment={appt}
                      onUpdate={(updatedAppt) => handleAppointmentUpdate(updatedAppt)}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">You have no pending client requests.</p>
          )}
        </div>
      )}
      {error && <p className="mt-4 text-center text-red-500">Error: {error}</p>}
    </div>
  )
}
