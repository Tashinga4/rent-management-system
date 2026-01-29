import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center gap-8 p-8 max-w-4xl">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Rent Management System
          </h1>
          <p className="text-xl text-gray-600">
            Manage your properties, tenants, and payments efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          <Link
            href="/properties"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">🏠</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              Properties
            </h2>
            <p className="text-gray-600">
              View and manage all your properties
            </p>
          </Link>

          <Link
            href="/tenants"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">👥</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              Tenants
            </h2>
            <p className="text-gray-600">
              Manage tenant information and leases
            </p>
          </Link>

          <Link
            href="/payments"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="text-4xl mb-4">💰</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              Payments
            </h2>
            <p className="text-gray-600">
              Track rent payments and transactions
            </p>
          </Link>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6 w-full">
          <h3 className="text-lg font-semibold mb-2">Backend API Status</h3>
          <p className="text-gray-600">
            Backend: <span className="text-green-600 font-medium">Running on http://localhost:5000</span>
          </p>
          <p className="text-gray-600">
            Frontend: <span className="text-green-600 font-medium">Running on http://localhost:3000</span>
          </p>
        </div>
      </main>
    </div>
  );
}
