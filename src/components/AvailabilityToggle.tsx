'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Profile = {
  id: string;
  name: string | null;
  is_available: boolean;
};

export default function AvailabilityToggle({ profile }: { profile: Profile }) {
  const [isAvailable, setIsAvailable] = useState<boolean>(profile.is_available ?? true);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');
  const router = useRouter();

  const toggleAvailability = () => {
    // Validate the profile ID before making the request
    if (!profile.id || typeof profile.id !== 'string' || profile.id.trim() === '') {
      setMessage('Invalid profile ID. Cannot update availability.');
      return;
    }

    startTransition(async () => {
      try {
        setMessage('');

        const response = await fetch(`/api/profile/${encodeURIComponent(profile.id)}/availability`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_available: !isAvailable }),
        });

        if (response.ok) {
          setIsAvailable(!isAvailable);
          setMessage(`Status updated successfully! You are now ${!isAvailable ? 'available' : 'unavailable'} for appointments.`);

          // Refresh the page to update the UI
          router.refresh();

          // Clear message after 3 seconds
          setTimeout(() => setMessage(''), 3000);
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Failed to update availability. Please try again.');
        }
      } catch (error) {
        console.error('Error updating availability:', error);
        setMessage('An error occurred while updating availability.');
      }
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600">
          You are currently <span className={`font-semibold ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
            {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
          </span> for new appointments.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          {isAvailable 
            ? 'Farmers and pet owners can book appointments with you.' 
            : 'Farmers and pet owners cannot book appointments with you right now.'}
        </p>
      </div>
      
      <button
        onClick={toggleAvailability}
        disabled={isPending}
        className={`px-6 py-2 rounded-md text-white font-medium ${
          isAvailable 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-green-600 hover:bg-green-700'
        } transition-colors duration-200 disabled:opacity-50`}
      >
        {isPending ? 'Updating...' : isAvailable ? 'Mark Unavailable' : 'Mark Available'}
      </button>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}