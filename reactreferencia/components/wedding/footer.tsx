import { Ornament } from "./ornament"

export function Footer() {
  return (
    <footer
      className="relative isolate w-full bg-olive bg-cover bg-center px-6 py-14 text-center text-olive-foreground"
      style={{ backgroundImage: "url('/images/stone-texture.png')" }}
    >
      {/* Dark overlay to keep text legible over the stone texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-olive/80"
      />

      <Ornament tone="gold" className="mb-6" />

      <p className="font-display text-sm tracking-[0.15em] text-cream/90 uppercase">
        &copy; 2024 Josue &amp; Ahinoam | Todos los derechos reservados.
      </p>
      <p className="mt-1 font-display text-sm tracking-[0.15em] text-cream/70 uppercase">
        Foto &amp; Cine | Capturado con Corazón
      </p>

      <button
        type="button"
        className="mt-8 inline-flex items-center justify-center rounded-full border border-gold/60 bg-transparent px-8 py-2.5 font-display text-sm tracking-widest text-cream uppercase transition-colors hover:bg-gold hover:text-gold-foreground"
      >
        Botón de Admin :)
      </button>
    </footer>
  )
}
