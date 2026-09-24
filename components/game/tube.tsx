"use client"

import { COLORS, TUBE_CAPACITY, type Tube as TubeType } from "@/lib/use-water-sort"
import { cn } from "@/lib/utils"

type TubeProps = {
  tube: TubeType
  index: number
  selected: boolean
  onClick: (index: number) => void
}

export function Tube({ tube, index, selected, onClick }: TubeProps) {
  const label = `Tube ${index + 1}, ${
    tube.length === 0 ? "empty" : `${tube.length} of ${TUBE_CAPACITY} filled`
  }`

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => onClick(index)}
      className={cn(
        "group relative flex flex-col-reverse items-center outline-none",
        "transition-transform duration-200 ease-out",
        selected ? "-translate-y-5" : "translate-y-0",
      )}
    >
      {/* Glass tube body */}
      <div
        className={cn(
          "relative flex flex-col-reverse gap-0 overflow-hidden",
          "rounded-b-[2.2rem] rounded-t-lg border-2 border-white/60",
          "bg-white/15 backdrop-blur-sm",
          "shadow-[inset_0_-8px_16px_rgba(0,0,0,0.12),inset_0_2px_6px_rgba(255,255,255,0.5)]",
          selected ? "ring-4 ring-white/70" : "ring-0",
        )}
        style={{
          width: "clamp(46px, 12vw, 62px)",
          height: "calc(clamp(46px, 12vw, 62px) * 4.1)",
        }}
      >
        {Array.from({ length: TUBE_CAPACITY }).map((_, slot) => {
          const color = tube[slot]
          const filled = color !== undefined
          const isTop = filled && slot === tube.length - 1
          return (
            <div
              key={slot}
              className={cn(
                "w-full transition-all duration-300 ease-out",
                isTop ? "rounded-t-[3px]" : "",
              )}
              style={{
                height: `${100 / TUBE_CAPACITY}%`,
                backgroundColor: filled ? COLORS[color] : "transparent",
                boxShadow: filled
                  ? "inset 0 3px 6px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.22)"
                  : "none",
              }}
            />
          )
        })}

        {/* Glass highlight streak */}
        <div className="pointer-events-none absolute inset-y-2 left-[18%] w-[10%] rounded-full bg-white/40 blur-[1px]" />
      </div>

      {/* Tube rim */}
      <div
        className="mb-[-2px] h-2 rounded-full border-2 border-white/70 bg-white/25"
        style={{ width: "calc(clamp(46px, 12vw, 62px) + 8px)" }}
      />
    </button>
  )
}
