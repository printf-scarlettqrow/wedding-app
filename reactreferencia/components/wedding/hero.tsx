import Image from "next/image"

export function Hero() {
  return (
    <section className="relative isolate min-h-[92vh] w-full overflow-hidden">
      {/* Background photo */}
      <Image
        src="/images/hero.png"
        alt="Josue y Ahinoam el día de su boda en una sala de madera clásica"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      {/* Warm darkening overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[92vh] flex-col items-center justify-center px-6 py-20 text-center text-cream">
        <p className="font-display text-sm tracking-[0.5em] text-cream/80 uppercase">
          Josue &amp; Ahinoam
        </p>

        <h1 className="mt-6 font-display text-6xl leading-[0.95] font-semibold tracking-wide text-balance sm:text-7xl md:text-8xl">
          <span className="block">Josue</span>
          <span className="my-2 block font-normal italic">&amp;</span>
          <span className="block">Ahinoam</span>
        </h1>

        {/* Subtitles with center ornament */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <div className="text-right">
            <p className="font-display text-xs tracking-[0.35em] uppercase sm:text-sm">
              Momentos
            </p>
            <p className="font-display text-xs tracking-[0.35em] uppercase sm:text-sm">
              Recuerdo
            </p>
          </div>

          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/70 text-gold"
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <circle cx="10" cy="15" r="6" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="16" cy="15" r="6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>

          <div className="text-left">
            <p className="font-display text-xs tracking-[0.35em] uppercase sm:text-sm">
              Capturado
            </p>
            <p className="font-display text-xs tracking-[0.35em] uppercase sm:text-sm">
              Con Corazón
            </p>
          </div>
        </div>

        <a
          href="#detalles"
          className="mt-12 inline-flex items-center justify-center rounded-full bg-primary px-12 py-3.5 font-display text-base tracking-[0.3em] text-cream uppercase shadow-md ring-1 ring-cream/20 transition-all duration-300 hover:bg-primary/85 hover:shadow-lg hover:ring-gold/50"
        >
          Comencemos
        </a>
      </div>
    </section>
  )
}
