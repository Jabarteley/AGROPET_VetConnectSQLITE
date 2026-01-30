'use client';

import { useState } from 'react';
import { updateAppointmentStatus, updateAppointmentDetails } from '@/app/appointments/actions';

type Appointment = {
  id: string;
  user_id: string;
  vet_id: string;
  status: string;
  diagnosis?: string | null;
  prescription?: string | null;
  vet_comments?: string | null;
  appointment_datetime: string;
  created_at: string;
  client_name: string;
  vet_name: string;
};

type Props = {
  appointment: Appointment;
  onUpdate: (updatedAppointment: Appointment) => void;
};

export default function VetAppointmentActions({ appointment, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [diagnosis, setDiagnosis] = useState(appointment.diagnosis || '');
  const [prescription, setPrescription] = useState(appointment.prescription || '');
  const [comments, setComments] = useState(appointment.vet_comments || '');
  const [proposedTime, setProposedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update the appointment with diagnosis, prescription, and comments
      const detailsResult = await updateAppointmentDetails(appointment.id, {
        diagnosis,
        prescription,
        vet_comments: comments,
      });

      if (detailsResult.error) {
        throw new Error(detailsResult.error);
      }

      // Then update the status to completed
      const statusResult = await updateAppointmentStatus(appointment.id, 'completed');

      if (statusResult.error) {
        setError(statusResult.error);
      } else {
        // Update the local state
        onUpdate({
          ...appointment,
          status: 'completed',
          diagnosis,
          prescription,
          vet_comments: comments,
        });
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeNewTime = async () => {
    if (!proposedTime) {
      setError('Please select a new time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update the appointment datetime
      const result = await updateAppointmentDetails(appointment.id, {
        appointment_datetime: proposedTime,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Status remains approved but with new time
      onUpdate({
        ...appointment,
        appointment_datetime: proposedTime,
      });

      setProposedTime('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (appointment.status === 'completed') {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Completed Appointment Details</h3>
        {appointment.diagnosis && (
          <div className="mb-2">
            <p><strong>Diagnosis:</strong> {appointment.diagnosis}</p>
          </div>
        )}
        {appointment.prescription && (
          <div className="mb-2">
            <p><strong>Prescription:</strong> {appointment.prescription}</p>
          </div>
        )}
        {appointment.vet_comments && (
          <div className="mb-2">
            <p><strong>Comments:</strong> {appointment.vet_comments}</p>
          </div>
        )}
      </div>
    );
  }

  if (appointment.status === 'pending') {
    return (
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          onClick={async () => {
            const result = await updateAppointmentStatus(appointment.id, 'approved');
            if (result.data) {
              onUpdate({...appointment, status: 'approved'});
            } else if (result.error) {
              setError(result.error);
            }
          }}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={async () => {
            const result = await updateAppointmentStatus(appointment.id, 'cancelled');
            if (result.data) {
              onUpdate({...appointment, status: 'cancelled'});
            } else if (result.error) {
              setError(result.error);
            }
          }}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (appointment.status === 'approved' && !isEditing) {
    return (
      <div className="mt-4">
        <div className="mb-3">
          <label htmlFor="newTime" className="block text-sm font-medium text-gray-700 mb-1">
            Propose New Time (if busy):
          </label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              id="newTime"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <button
              onClick={handleProposeNewTime}
              disabled={loading || !proposedTime}
              className="px-3 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Propose
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Add Diagnosis & Prescription
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-white border rounded-lg">
      <h3 className="font-semibold text-lg mb-3">Add Diagnosis & Prescription</h3>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
            Diagnosis
          </label>
          <textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter diagnosis..."
          />
        </div>

        <div className="mb-3">
          <label htmlFor="prescription" className="block text-sm font-medium text-gray-700 mb-1">
            Prescription
          </label>
          <textarea
            id="prescription"
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Enter prescription..."
          />
        </div>

        <div className="mb-4">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Comments
          </label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Any additional comments..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Appointment'}
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}