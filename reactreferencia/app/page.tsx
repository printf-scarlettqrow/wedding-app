import { Hero } from "@/components/wedding/hero"
import { LoveDetails } from "@/components/wedding/love-details"
import { Countdown } from "@/components/wedding/countdown"
import { PhotoNotes } from "@/components/wedding/photo-notes"
import { Footer } from "@/components/wedding/footer"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <LoveDetails />
      <Countdown />
      <PhotoNotes />
      <Footer />
    </main>
  )
}
