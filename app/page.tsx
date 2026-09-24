import { HotelGame } from "@/components/hotel-game"

export default function Page() {
  return (
    <main className="min-h-dvh w-full bg-gradient-to-b from-sky-100 to-sky-50 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center">
        <header className="mb-5 text-center">
          <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">
            My Perfect Hotel
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Seat guests, collect the cash, keep it spotless, and grow your empire.
          </p>
        </header>
        <HotelGame />
      </div>
    </main>
  )
}
