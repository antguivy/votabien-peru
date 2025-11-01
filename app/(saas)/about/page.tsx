"use client";

import { useState } from "react";
import {
  Search,
  Users,
  Scale,
  Shield,
  BookOpen,
  Github,
  ExternalLink,
  CheckCircle2,
  Target,
  Heart,
  Code,
  Database,
  Globe,
  FileText,
} from "lucide-react";
import Link from "next/link";
export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"mission" | "features" | "values">(
    "mission",
  );

  const features = [
    {
      icon: Users,
      title: "Comparador de Congresistas",
      description:
        "Compara perfiles, votaciones, asistencias y propuestas legislativas de manera visual e intuitiva.",
      color: "bg-info",
    },
    {
      icon: Scale,
      title: "Hemiciclo Actualizado",
      description:
        "Visualiza la distribución actual de escaños por bancadas y partidos originales de forma interactiva.",
      color: "bg-primary",
    },
    {
      icon: Shield,
      title: "Antecedentes Verificados",
      description:
        "Accede a información sobre casos penales, éticos, civiles y administrativos con referencias a fuentes oficiales o periodísticas reconocidas.",
      color: "bg-destructive",
    },
    {
      icon: BookOpen,
      title: "Biografías Completas",
      description:
        "Historial político, académico, laboral y controversias documentadas de cada legislador.",
      color: "bg-success",
    },
    {
      icon: FileText,
      title: "Fuentes Verificables",
      description:
        "Todas las referencias incluyen enlaces a fuentes periodísticas oficiales y documentos públicos.",
      color: "bg-warning",
    },
    {
      icon: Code,
      title: "100% Open Source",
      description:
        "Código abierto en GitHub. Backend y frontend disponibles para la comunidad.",
      color: "bg-primary",
    },
  ];

  const values = [
    {
      icon: Scale,
      title: "Neutralidad",
      description:
        "Presentamos información sin sesgos políticos ni editorializaciones.",
    },
    {
      icon: Shield,
      title: "Transparencia",
      description:
        "Todas nuestras fuentes son verificables y están públicamente disponibles.",
    },
    {
      icon: Heart,
      title: "Servicio Ciudadano",
      description:
        "Creado por peruanos, para peruanos que quieren informarse mejor.",
    },
    {
      icon: CheckCircle2,
      title: "Veracidad",
      description: "Información contrastada y actualizada constantemente.",
    },
  ];

  const stats = [
    { number: "130", label: "Congresistas", sublabel: "Perfiles completos" },
    { number: "100%", label: "Open Source", sublabel: "Código abierto" },
    {
      number: "Frecuente",
      label: "Actualización",
      sublabel: "Datos revisados constantemente",
    },
    { number: "0", label: "Publicidad", sublabel: "Completamente libre" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Sobre <span className="text-primary">VotaBienPerú</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Una plataforma ciudadana para conocer más a quiénes nos
              representan y nos representarán
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Search className="w-5 h-5" />
                Explorar Funciones
              </Link>
              <Link
                href="https://github.com/antguivy/votabien-peru-frontend"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-card text-card-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-border"
              >
                <Github className="w-5 h-5" />
                Ver en GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-sm md:text-base font-semibold text-foreground">
                  {stat.label}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Nuestro Origen
                </h2>
              </div>

              <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
                <p className="text-lg leading-relaxed">
                  VotaBienPerú nació de una{" "}
                  <span className="font-semibold text-primary">
                    necesidad ciudadana real
                  </span>
                  : conocer de forma simple y rápida quiénes son las personas
                  que nos representan en el Congreso.
                </p>

                <p className="text-lg leading-relaxed">
                  En un contexto donde la información política está{" "}
                  <span className="font-semibold text-foreground">
                    dispersa, fragmentada o difícil de acceder
                  </span>
                  , creamos una plataforma que centraliza y presenta datos
                  verificables sobre nuestros legisladores de manera clara y
                  neutral.
                </p>

                <div className="bg-primary/10 rounded-xl p-6 border-l-4 border-primary">
                  <p className="text-lg leading-relaxed font-medium text-foreground mb-0">
                    Creemos que una democracia informada es una democracia más
                    fuerte. Por eso, ponemos el poder de la información en manos
                    de la ciudadanía.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission/Vision Tabs */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Nuestro Propósito
              </h2>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setActiveTab("mission")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "mission"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                Misión
              </button>
              <button
                onClick={() => setActiveTab("features")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "features"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                Objetivo
              </button>
              <button
                onClick={() => setActiveTab("values")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "values"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                Valores
              </button>
            </div>

            <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 border border-border">
              {activeTab === "mission" && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    Nuestra Misión
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Democratizar el acceso a información política verificable y
                    presentarla de manera comprensible para todos los peruanos,
                    sin importar su nivel de conocimiento político.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Facilitamos que cualquier ciudadano pueda conocer en minutos
                    los antecedentes, biografía, educación, experiencia laboral
                    e historial de votaciones de sus representantes en el
                    Congreso.
                  </p>
                </div>
              )}

              {activeTab === "features" && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    Nuestro Objetivo
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Informar de forma{" "}
                    <span className="font-semibold text-primary">
                      neutral pero verídica
                    </span>{" "}
                    sobre el entorno político peruano.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                      <span className="text-lg text-muted-foreground">
                        <strong className="text-foreground">
                          Antecedentes completos:
                        </strong>{" "}
                        Casos penales, éticos, civiles y administrativos
                        documentados
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                      <span className="text-lg text-muted-foreground">
                        <strong className="text-foreground">
                          Biografía detallada:
                        </strong>{" "}
                        Historial político, académico, laboral y controversias
                        relevantes
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                      <span className="text-lg text-muted-foreground">
                        <strong className="text-foreground">
                          Referencias verificables:
                        </strong>{" "}
                        Todos los datos incluyen enlaces a fuentes periodísticas
                        u oficiales
                      </span>
                    </li>
                  </ul>
                </div>
              )}

              {activeTab === "values" && (
                <div className="grid md:grid-cols-2 gap-6">
                  {values.map((value, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 p-6 bg-muted/50 rounded-xl hover:shadow-lg transition-shadow duration-300 border border-border"
                    >
                      <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <value.icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground mb-2">
                          {value.title}
                        </h4>
                        <p className="text-muted-foreground">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funcionalidades
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas para que la ciudadanía tenga acceso directo
              y claro a la información política
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-card rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-border hover:border-primary"
              >
                <div
                  className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/95 to-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              100% Código Abierto
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Transparencia desde el Código
            </h2>

            <p className="text-xl opacity-90 mb-8 leading-relaxed">
              VotaBienPerú es completamente{" "}
              <span className="font-semibold">open source</span>. Tanto el
              backend como el frontend están disponibles públicamente en GitHub.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <Database className="w-10 h-10 opacity-90 mb-4 mx-auto" />
                <h3 className="text-lg font-bold mb-2">Backend</h3>
                <Link
                  href="https://github.com/antguivy/votabien-peru-backend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-80 font-medium transition-opacity"
                >
                  Ver repositorio
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <Globe className="w-10 h-10 opacity-90 mb-4 mx-auto" />
                <h3 className="text-lg font-bold mb-2">Frontend</h3>
                <Link
                  href="https://github.com/antguivy/votabien-peru-frontend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-80 font-medium transition-opacity"
                >
                  Ver repositorio
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <p className="opacity-70 text-sm">
              Creemos en la transparencia total. Cualquiera puede auditar
              nuestro código, proponer mejoras o contribuir al proyecto.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 md:p-12 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
              Juntos Construimos una Democracia más Informada
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              VotaBienPerú es un proyecto ciudadano para ciudadanos. Empieza a
              explorar quiénes nos representan.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-background text-foreground font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Search className="w-5 h-5" />
                Explorar Congresistas
              </Link>
              <Link
                href="https://github.com/antguivy/votabien-peru-frontend"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-primary-foreground font-bold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                <Github className="w-5 h-5" />
                Contribuir en GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
