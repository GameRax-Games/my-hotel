"use client"

import { costs, type Game } from "@/lib/use-hotel-game"

interface ShopPanelProps {
  game: Game
  actions: {
    buyRoom: () => void
    upgradeRate: () => void
    upgradeSpeed: () => void
    hire: (t: "reception" | "bellhop" | "cleaner") => void
  }
}

function ShopButton({
  title,
  sub,
  cost,
  affordable,
  disabled,
  accent,
  onClick,
}: {
  title: string
  sub: string
  cost: number | null
  affordable: boolean
  disabled?: boolean
  accent: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !affordable}
      className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-black/5 bg-white px-3 py-2.5 text-left shadow-sm transition enabled:hover:-translate-y-0.5 enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="flex flex-col">
        <span className="text-sm font-bold text-slate-800">{title}</span>
        <span className="text-[11px] leading-tight text-slate-500">{sub}</span>
      </span>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold text-white"
        style={{ background: disabled ? "#9aa4b2" : accent }}
      >
        {disabled ? "OWNED" : cost === null ? "" : `$${cost}`}
      </span>
    </button>
  )
}

export function ShopPanel({ game, actions }: ShopPanelProps) {
  const roomCost = costs.room(game)
  const rateCost = costs.rate(game)
  const speedCost = costs.speed(game)

  return (
    <div className="flex flex-col gap-2">
      <h2 className="px-1 text-xs font-black uppercase tracking-wider text-slate-400">Manage Hotel</h2>

      <ShopButton
        title="Build Room"
        sub={`${game.rooms.length} rooms · +1 capacity`}
        cost={roomCost}
        affordable={game.money >= roomCost}
        accent="#2d6cdf"
        onClick={actions.buyRoom}
      />
      <ShopButton
        title="Raise Nightly Rate"
        sub={`Now $${game.price}/tick → $${game.price + 3}`}
        cost={rateCost}
        affordable={game.money >= rateCost}
        accent="#34c759"
        onClick={actions.upgradeRate}
      />
      <ShopButton
        title="Faster Service"
        sub={`Staff move quicker (Lv.${game.speedLevel + 1})`}
        cost={speedCost}
        affordable={game.money >= speedCost}
        accent="#ff9500"
        onClick={actions.upgradeSpeed}
      />

      <h2 className="mt-2 px-1 text-xs font-black uppercase tracking-wider text-slate-400">Hire Staff</h2>

      <ShopButton
        title="Receptionist"
        sub="Auto-checks in guests"
        cost={costs.reception}
        affordable={game.money >= costs.reception}
        disabled={game.hasReception}
        accent="#d94f9a"
        onClick={() => actions.hire("reception")}
      />
      <ShopButton
        title="Bellhop"
        sub="Auto-collects cash"
        cost={costs.bellhop}
        affordable={game.money >= costs.bellhop}
        disabled={game.hasBellhop}
        accent="#f0a020"
        onClick={() => actions.hire("bellhop")}
      />
      <ShopButton
        title="Cleaner"
        sub="Auto-cleans rooms"
        cost={costs.cleaner}
        affordable={game.money >= costs.cleaner}
        disabled={game.hasCleaner}
        accent="#35b0a7"
        onClick={() => actions.hire("cleaner")}
      />
    </div>
  )
}
