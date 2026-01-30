import VetDirectoryServer from '@/components/VetDirectoryServer'
import { Suspense } from 'react'

// Client component for search functionality
function SearchForm({ initialSearch }: { initialSearch?: string }) {
  return (
    <form action={`/veterinarians`} method="get" className="mb-6">
      <input
        type="text"
        name="search"
        placeholder="Search by name, location, or specialization..."
        defaultValue={initialSearch}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button type="submit" className="sr-only">Search</button>
    </form>
  );
}

export default function VeterinariansPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const searchTerm = typeof searchParams?.search === 'string' ? searchParams.search : '';

  return (
    <div className="flex flex-col items-center p-4 w-full">
      <div className="w-full max-w-4xl px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Find a Veterinarian
        </h1>
        <SearchForm initialSearch={searchTerm} />
        <Suspense fallback={<p className="text-center">Loading veterinarians...</p>}>
          <VetDirectoryServer searchTerm={searchTerm} />
        </Suspense>
      </div>
    </div>
  )
}
