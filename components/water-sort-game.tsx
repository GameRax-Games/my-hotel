"use client"

import { Tube } from "@/components/game/tube"
import { Button } from "@/components/ui/button"
import { useWaterSort } from "@/lib/use-water-sort"
import { cn } from "@/lib/utils"
import { RotateCcw, Undo2 } from "lucide-react"

export function WaterSortGame() {
  const {
    level,
    tubes,
    ready,
    selected,
    moves,
    status,
    canUndo,
    hasMoves,
    handleTubeClick,
    undo,
    restart,
    nextLevel,
  } = useWaterSort()

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-gradient-to-b from-sky-400 via-sky-500 to-indigo-700 px-4 py-6 text-white">
      {/* Decorative bubbles */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[20%] h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute right-[12%] top-[35%] h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <div className="absolute left-[30%] bottom-[10%] h-40 w-40 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Header */}
      <header className="z-10 flex w-full max-w-lg items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight drop-shadow-sm sm:text-3xl">
            Water Sort
          </h1>
          <p className="text-sm font-medium text-white/80">Sort the colors into matching tubes</p>
        </div>
        <div className="flex gap-2">
          <div className="flex min-w-16 flex-col items-center rounded-2xl bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
              Level
            </span>
            <span className="text-lg font-bold leading-none">{level}</span>
          </div>
          <div className="flex min-w-16 flex-col items-center rounded-2xl bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
              Moves
            </span>
            <span className="text-lg font-bold leading-none">{moves}</span>
          </div>
        </div>
      </header>

      {/* Playfield */}
      <section className="z-10 flex flex-1 items-center justify-center py-6">
        <div className="flex min-h-72 max-w-2xl flex-wrap items-end justify-center gap-x-4 gap-y-8 sm:gap-x-6">
          {ready
            ? tubes.map((tube, i) => (
                <Tube
                  key={i}
                  tube={tube}
                  index={i}
                  selected={selected === i}
                  onClick={handleTubeClick}
                />
              ))
            : null}
        </div>
      </section>

      {/* Controls */}
      <footer className="z-10 flex w-full max-w-lg items-center justify-center gap-3 pb-2">
        <Button
          onClick={undo}
          disabled={!canUndo || status === "won"}
          variant="secondary"
          className="h-12 flex-1 gap-2 rounded-2xl bg-white/20 text-base font-bold text-white hover:bg-white/30 disabled:opacity-40"
        >
          <Undo2 className="h-5 w-5" />
          Undo
        </Button>
        <Button
          onClick={restart}
          variant="secondary"
          className="h-12 flex-1 gap-2 rounded-2xl bg-white/20 text-base font-bold text-white hover:bg-white/30"
        >
          <RotateCcw className="h-5 w-5" />
          Restart
        </Button>
      </footer>

      {/* Stuck hint */}
      {status === "playing" && !hasMoves && (
        <div className="z-10 mb-2 rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold text-white">
          No moves left — try Undo or Restart
        </div>
      )}

      {/* Win overlay */}
      {status === "won" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center text-slate-800 shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              <span className="font-black text-emerald-500">✓</span>
            </div>
            <div>
              <h2 className="text-2xl font-black">Level {level} Complete!</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Solved in {moves} {moves === 1 ? "move" : "moves"}
              </p>
            </div>
            <Button
              onClick={nextLevel}
              className={cn(
                "h-12 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-base font-bold text-white",
                "hover:from-sky-600 hover:to-indigo-700",
              )}
            >
              Next Level
            </Button>
            <button
              onClick={restart}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Replay this level
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
