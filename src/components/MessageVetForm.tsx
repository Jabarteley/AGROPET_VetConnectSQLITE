'use client';

import { initiateConversation } from '@/app/veterinarians/actions';

type MessageVetFormProps = {
  vetId: string;
};

export default function MessageVetForm({ vetId }: MessageVetFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call the server action directly
    await initiateConversation(vetId);
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        className="w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 border-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Message Vet
      </button>
    </form>
  );
}