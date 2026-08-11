import Image from "next/image"
import { Ornament } from "./ornament"

const photos = [
  { src: "/images/gallery-1.png", alt: "Anillo de compromiso en la mano de la novia" },
  { src: "/images/gallery-2.png", alt: "Ramo de novia con rosas blancas y eucalipto" },
  { src: "/images/gallery-3.png", alt: "Los novios caminando entre los invitados" },
  { src: "/images/gallery-4.png", alt: "Detalle del boutonnière del novio" },
  { src: "/images/gallery-5.png", alt: "Detalle del vestido de novia de encaje" },
  { src: "/images/gallery-6.png", alt: "Los novios firmando el acta de matrimonio" },
]

export function LoveDetails() {
  return (
    <section
      id="detalles"
      className="paper-watercolor w-full px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display text-4xl font-semibold tracking-wide text-primary text-balance sm:text-5xl">
          Detalles de un amor
        </h2>
        <p className="mt-3 font-display text-xl text-accent-foreground/70 italic">
          — donde cada momento cuenta —
        </p>

        <Ornament tone="gold" className="mt-6" />

        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
          Cada imagen guarda un instante irrepetible: la emoción de una mirada,
          el temblor de unas manos entrelazadas y la ternura de un &ldquo;sí&rdquo;
          para siempre. Reunimos aquí los detalles más íntimos de esta historia,
          para que puedan revivir la magia de este día, una y otra vez.
        </p>
      </div>

      {/* Photo grid */}
      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {photos.map((photo) => (
          <div
            key={photo.src}
            className="relative aspect-[4/3] overflow-hidden rounded-md ring-1 ring-border/60 shadow-sm shadow-primary/5"
          >
            <Image
              src={photo.src || "/placeholder.svg"}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
