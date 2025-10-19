'use client'

interface StatsProps {
  stats: {
    totalCongresistas: number;
    totalPartidos: number;
    congresistasSuspendidos: number;
    proyectosEnCurso: number;
  };
}

export default function Stats({ stats }: StatsProps) {
  const statsData = [
    {
      label: "Congresistas",
      value: stats.totalCongresistas,
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "from-primary to-primary/80",
      bgColor: "bg-primary/10",
      textColor: "text-primary",
    },
    {
      label: "Partidos Políticos",
      value: stats.totalPartidos,
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: "from-info to-info/80",
      bgColor: "bg-info/10",
      textColor: "text-info",
    },
    {
      label: "Suspendidos",
      value: stats.congresistasSuspendidos,
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: "from-warning to-warning/80",
      bgColor: "bg-warning/10",
      textColor: "text-warning",
    },
    {
      label: "Proyectos",
      value: stats.proyectosEnCurso,
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "from-success to-success/80",
      bgColor: "bg-success/10",
      textColor: "text-success",
    },
  ];

  return (
    <section className="py-8 md:py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Datos en Tiempo Real
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            Información actualizada del Congreso
          </p>
        </div>

        {/* Grid compacto optimizado para móvil */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-5xl mx-auto">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-lg md:rounded-xl p-4 md:p-5 border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              {/* Content - Layout horizontal en móvil */}
              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icon */}
                <div className={`${stat.bgColor} ${stat.textColor} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-2 md:mb-3 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {stat.icon}
                </div>

                {/* Value */}
                <div className={`text-2xl md:text-3xl lg:text-4xl font-bold ${stat.textColor} mb-1 tabular-nums`}>
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
                  {stat.label}
                </div>
              </div>

              {/* Decorative corner */}
              <div className={`absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300`}></div>
            </div>
          ))}
        </div>

        {/* Info banner compacto */}
        <div className="mt-6 md:mt-8 max-w-3xl mx-auto">
          <div className="bg-info/10 border border-info/20 rounded-lg p-3 md:p-4 flex items-start gap-2 md:gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-info" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs md:text-sm text-foreground/80 leading-relaxed">
              <span className="font-semibold">Actualizado:</span> Datos sincronizados con fuentes oficiales del Congreso.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}