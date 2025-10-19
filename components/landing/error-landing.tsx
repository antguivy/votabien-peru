'use client'

export default function ErrorLanding() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Error al cargar datos
        </h1>
        <p className="text-gray-600 mb-4">
          No se pudieron cargar los datos del servidor. Por favor, intenta
          nuevamente.
        </p>
        {/* <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button> */}
      </div>
    </div>
  );
}
