export default function Footer() {
  return (
    <section className="bg-blue-600 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Transparencia al Servicio de la Ciudadanía
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
          Accede a información verificada sobre la gestión de tus
          representantes. Conoce sus proyectos, asistencias, expedientes y más.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/legisladores"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
          >
            Explorar Congresistas
          </a>
          <a
            href="/about"
            className="inline-flex items-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-blue-700"
          >
            Sobre este proyecto
          </a>
        </div>
      </div>
    </section>
  );
}
