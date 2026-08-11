import { ImageIcon, Clock, Users } from "lucide-react"

const stats = [
  {
    icon: ImageIcon,
    value: "248",
    label: "Momentos",
    hint: "Fotos y videos",
  },
  {
    icon: Clock,
    value: "Hace 2 h",
    label: "Última actividad",
    hint: "Nueva subida",
  },
  {
    icon: Users,
    value: "36",
    label: "Personas",
    hint: "Han compartido",
  },
]

export function Metrics() {
  return (
    <section
      className="relative isolate w-full overflow-hidden bg-olive bg-cover bg-center px-6 py-20 text-olive-foreground"
      style={{ backgroundImage: "url('/images/olive-pattern.png')" }}
    >
      {/* Tint overlay to unify the texture with the olive palette */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-olive/85" />

      {/* Heading */}
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="font-display text-xs tracking-[0.45em] text-gold uppercase">
          Nuestra Galería en Vivo
        </p>
        <h2 className="mt-3 font-display text-3xl font-medium tracking-wide text-balance text-cream sm:text-4xl">
          Cada recuerdo compartido
        </h2>

        {/* Ornamental divider */}
        <div className="mt-5 flex items-center gap-3 text-gold">
          <span className="h-px w-12 bg-gold/50" />
          <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
            <circle cx="10" cy="13" r="6" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="16" cy="13" r="6" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="h-px w-12 bg-gold/50" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center rounded-lg border border-gold/25 bg-cream/5 px-6 py-8 text-center backdrop-blur-sm"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 text-gold">
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span className="mt-5 font-display text-4xl font-semibold text-cream">
                {stat.value}
              </span>
              <span className="mt-2 font-display text-sm tracking-[0.28em] text-cream uppercase">
                {stat.label}
              </span>
              <span className="mt-1 text-sm text-cream/70">{stat.hint}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
