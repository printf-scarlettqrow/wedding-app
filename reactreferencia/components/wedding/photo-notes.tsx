import Image from "next/image"
import { Leaf } from "lucide-react"

const notes = [
  {
    src: "/images/detail-1.png",
    alt: "Los novios tomados de la mano con ternura",
    description: "El primer roce de manos antes de la ceremonia.",
    persona: "Josue & Ahinoam",
    reverse: false,
  },
  {
    src: "/images/detail-2.png",
    alt: "Ramita de olivo y eucalipto sostenida en una mano",
    description: "Un pequeño gesto de la naturaleza que nos acompañó.",
    persona: "Detalle floral",
    reverse: true,
  },
  {
    src: "/images/detail-3.png",
    alt: "Detalle del vestido de novia de encaje",
    description: "El encaje que guardó los latidos de la novia.",
    persona: "Ahinoam",
    reverse: false,
  },
]

export function PhotoNotes() {
  return (
    <section className="paper-texture relative isolate w-full overflow-hidden px-6 py-20 sm:py-28">
      {/* Decorative eucalyptus leaves along the edges */}
      <Leaf
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-24 h-24 w-24 -rotate-12 text-primary/15"
      />
      <Leaf
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 h-28 w-28 rotate-[150deg] text-primary/15"
      />
      <Leaf
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 left-6 h-20 w-20 rotate-45 text-primary/15"
      />

      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-display text-4xl font-semibold tracking-wide text-primary text-balance sm:text-5xl">
          Detalles de un amor
        </h2>
      </div>

      <div className="mx-auto mt-16 flex max-w-4xl flex-col gap-16">
        {notes.map((note, i) => (
          <div
            key={i}
            className={`flex flex-col items-center gap-6 md:flex-row md:gap-10 ${
              note.reverse ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Photo */}
            <div className="relative aspect-[4/5] w-full max-w-xs shrink-0 overflow-hidden rounded-md ring-1 ring-border/60 shadow-sm shadow-primary/5">
              <Image
                src={note.src || "/placeholder.svg"}
                alt={note.alt}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-cover"
              />
            </div>

            {/* Notes */}
            <div className="flex w-full flex-col items-start gap-4">
              <div className="torn-note w-full max-w-sm px-8 py-6">
                <p className="font-display text-xs tracking-[0.25em] text-gold uppercase">
                  Descripción
                </p>
                <p className="mt-2 text-lg leading-relaxed text-foreground text-pretty">
                  {note.description}
                </p>
              </div>
              <div className="torn-note ml-6 px-7 py-4">
                <p className="font-display text-xs tracking-[0.25em] text-primary uppercase">
                  Persona
                </p>
                <p className="mt-1 text-base text-foreground">{note.persona}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
