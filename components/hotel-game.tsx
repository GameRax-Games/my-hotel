"use client"

import { useEffect, useRef, useState } from "react"
import {
  BUILD_LEFT,
  BUILD_RIGHT,
  ENTRANCE_X,
  FLOOR_H,
  GROUND_Y,
  RECEPTION_X,
  ROOM_H,
  ROOM_W,
  SHAFT_X,
  WORLD_H,
  WORLD_W,
  floorFootY,
  useHotelGame,
  type Game,
} from "@/lib/use-hotel-game"
import { Character } from "@/components/game/character"
import { ShopPanel } from "@/components/game/shop-panel"

function useScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setScale(el.clientWidth / WORLD_W))
    ro.observe(el)
    setScale(el.clientWidth / WORLD_W)
    return () => ro.disconnect()
  }, [ref])
  return scale
}

function Building({ game }: { game: Game }) {
  const maxFloor = Math.max(1, Math.ceil(game.rooms.length / 3))
  const topY = floorFootY(maxFloor) - ROOM_H - 14
  const buildW = BUILD_RIGHT - BUILD_LEFT
  return (
    <>
      {/* building body */}
      <div
        style={{
          position: "absolute",
          left: BUILD_LEFT,
          top: topY,
          width: buildW,
          height: GROUND_Y - topY + 34,
          background: "linear-gradient(180deg,#fbf3e2,#f1e2c6)",
          borderRadius: "18px 18px 0 0",
          boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.05)",
          zIndex: 1,
        }}
      />
      {/* roof cap */}
      <div
        style={{
          position: "absolute",
          left: BUILD_LEFT - 10,
          top: topY - 20,
          width: buildW + 20,
          height: 26,
          background: "#c0705a",
          borderRadius: "12px 12px 6px 6px",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: BUILD_LEFT + buildW / 2 - 42,
          top: topY - 52,
          width: 84,
          textAlign: "center",
          fontWeight: 900,
          fontSize: 15,
          letterSpacing: 1,
          color: "#c0705a",
          zIndex: 1,
        }}
      >
        HOTEL
      </div>
      {/* elevator shaft */}
      <div
        style={{
          position: "absolute",
          left: SHAFT_X - 22,
          top: topY,
          width: 44,
          height: GROUND_Y - topY,
          background: "linear-gradient(180deg,#d5dde6,#c3cdd8)",
          borderRadius: 8,
          boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.06)",
          zIndex: 1,
        }}
      />
      {/* floor separators */}
      {Array.from({ length: maxFloor }).map((_, i) => {
        const vf = i + 1
        return (
          <div
            key={vf}
            style={{
              position: "absolute",
              left: BUILD_LEFT + 8,
              top: floorFootY(vf) + 6,
              width: buildW - 16,
              height: 4,
              background: "rgba(0,0,0,0.06)",
              borderRadius: 4,
              zIndex: 1,
            }}
          />
        )
      })}
    </>
  )
}

function RoomView({
  room,
  onTap,
}: {
  room: Game["rooms"][number]
  onTap: () => void
}) {
  const top = room.footY - ROOM_H
  const left = room.x - ROOM_W / 2
  const canAct = room.cash > 0 || room.state === "dirty" || room.state === "empty"
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: ROOM_W,
          height: ROOM_H,
          zIndex: 3,
        }}
      >
        {/* wall */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 12,
            background:
              room.state === "dirty"
                ? "linear-gradient(180deg,#e7ddcb,#d8cbb2)"
                : "linear-gradient(180deg,#fffdf7,#f2ead9)",
            boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {/* window */}
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              width: 46,
              height: 40,
              borderRadius: 8,
              background:
                room.state === "occupied"
                  ? "linear-gradient(180deg,#ffe8a3,#ffd45e)"
                  : "linear-gradient(180deg,#bfe3ff,#8ec5f0)",
              boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.6)",
            }}
          >
            {room.state === "occupied" && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 14,
                  transform: "translateX(-50%)",
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#f6d2a9",
                  border: "2px solid rgba(0,0,0,0.15)",
                }}
              />
            )}
          </div>
          {/* door */}
          <div
            style={{
              position: "absolute",
              right: 14,
              bottom: 0,
              width: 38,
              height: 62,
              borderRadius: "8px 8px 0 0",
              background: room.doorColor,
              opacity: room.state === "dirty" ? 0.5 : 1,
              boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 6,
                top: "50%",
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.85)",
              }}
            />
          </div>
          {/* dirty overlay */}
          {room.state === "dirty" && (
            <div
              style={{
                position: "absolute",
                left: 10,
                bottom: 6,
                fontSize: 18,
                filter: "grayscale(0.2)",
              }}
            >
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#8a7a5c", transform: "rotate(15deg)" }} />
              <span style={{ display: "inline-block", width: 8, height: 8, marginLeft: 4, borderRadius: "50%", background: "#9c8a66" }} />
            </div>
          )}
        </div>

        {/* stay progress */}
        {room.state === "occupied" && (
          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: -8,
              height: 5,
              borderRadius: 4,
              background: "rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.max(0, Math.min(100, (room.stay / 13000) * 100))}%`,
                background: "#34c759",
                transition: "width 120ms linear",
              }}
            />
          </div>
        )}
      </div>

      {/* cash stack */}
      {room.cash > 0 && (
        <div
          style={{
            position: "absolute",
            left: room.x,
            top: top - 30,
            transform: "translateX(-50%)",
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "#2b7a3d",
              color: "white",
              fontWeight: 800,
              fontSize: 13,
              padding: "3px 8px",
              borderRadius: 999,
              boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#ffd45e",
                border: "2px solid #e0a92e",
                display: "inline-block",
              }}
            />
            ${room.cash}
          </div>
        </div>
      )}

      {/* clickable */}
      <button
        type="button"
        aria-label={`Room ${room.idx + 1}`}
        onClick={onTap}
        style={{
          position: "absolute",
          left,
          top: top - 30,
          width: ROOM_W,
          height: ROOM_H + 30,
          background: "transparent",
          border: "none",
          cursor: canAct ? "pointer" : "default",
          zIndex: 12,
        }}
      />
    </>
  )
}

export function HotelGame() {
  const { game, actions } = useHotelGame()
  const wrapRef = useRef<HTMLDivElement>(null)
  const scale = useScale(wrapRef)
  if (!game) return null

  const hasWaiting = game.guests.some((g) => g.state === "waiting")
  const hasEmpty = game.rooms.some((r) => r.state === "empty" && !r.escorting)
  const receptionHint = hasWaiting && hasEmpty

  return (
    <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
      {/* GAME WORLD */}
      <div className="w-full max-w-[960px]">
        <div
          ref={wrapRef}
          className="relative w-full overflow-hidden rounded-3xl shadow-xl ring-1 ring-black/5"
          style={{ height: WORLD_H * scale }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: WORLD_W,
              height: WORLD_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: "linear-gradient(180deg,#bfe3ff 0%,#d9f0ff 55%,#eaf7ff 100%)",
            }}
          >
            {/* clouds */}
            <div style={{ position: "absolute", top: 40, left: 620, width: 90, height: 30, borderRadius: 20, background: "rgba(255,255,255,0.8)" }} />
            <div style={{ position: "absolute", top: 70, left: 700, width: 60, height: 22, borderRadius: 16, background: "rgba(255,255,255,0.7)" }} />
            <div style={{ position: "absolute", top: 30, left: 760, width: 70, height: 24, borderRadius: 16, background: "rgba(255,255,255,0.75)" }} />

            {/* ground / sidewalk */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: GROUND_Y,
                width: WORLD_W,
                height: WORLD_H - GROUND_Y,
                background: "linear-gradient(180deg,#b8d98a,#a6cd76)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: GROUND_Y + 34,
                width: WORLD_W,
                height: WORLD_H - GROUND_Y - 34,
                background: "#cbb79a",
              }}
            />

            <Building game={game} />

            {/* reception desk */}
            <div
              style={{
                position: "absolute",
                left: RECEPTION_X - 46,
                top: GROUND_Y - 46,
                width: 92,
                height: 46,
                borderRadius: "10px 10px 4px 4px",
                background: "linear-gradient(180deg,#8a5a3c,#6b4429)",
                boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.08)",
                zIndex: 4,
              }}
            >
              <div style={{ position: "absolute", inset: "6px 8px auto 8px", height: 14, borderRadius: 4, background: "#c99a6a" }} />
            </div>
            <div
              style={{
                position: "absolute",
                left: RECEPTION_X,
                top: GROUND_Y - 92,
                transform: "translateX(-50%)",
                fontSize: 11,
                fontWeight: 800,
                color: "#6b4429",
                background: "rgba(255,255,255,0.85)",
                padding: "2px 8px",
                borderRadius: 999,
                zIndex: 4,
              }}
            >
              Reception
            </div>

            {/* entrance door */}
            <div
              style={{
                position: "absolute",
                left: ENTRANCE_X - 22,
                top: GROUND_Y - 70,
                width: 44,
                height: 70,
                borderRadius: "10px 10px 0 0",
                background: "linear-gradient(180deg,#7fa8d0,#5b84b0)",
                boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.4)",
                zIndex: 2,
              }}
            />

            {/* reception click zone */}
            <button
              type="button"
              aria-label="Check in guest at reception"
              onClick={actions.onTapReception}
              style={{
                position: "absolute",
                left: RECEPTION_X - 60,
                top: GROUND_Y - 96,
                width: 320,
                height: 130,
                background: "transparent",
                border: "none",
                cursor: receptionHint ? "pointer" : "default",
                zIndex: 11,
              }}
            />
            {receptionHint && (
              <div
                style={{
                  position: "absolute",
                  left: RECEPTION_X,
                  top: GROUND_Y - 128,
                  transform: "translateX(-50%)",
                  zIndex: 13,
                  pointerEvents: "none",
                  animation: "bob 0.8s ease-in-out infinite",
                }}
              >
                <div
                  style={{
                    background: "#ff9500",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 12,
                    padding: "4px 10px",
                    borderRadius: 999,
                    boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Tap to check in ▾
                </div>
              </div>
            )}

            {/* rooms */}
            {game.rooms.map((r) => (
              <RoomView key={r.idx} room={r} onTap={() => actions.onTapRoom(r.idx)} />
            ))}

            {/* guests */}
            {game.guests
              .filter((g) => g.state !== "inRoom")
              .map((g) => (
                <Character key={g.id} x={g.x} y={g.y} transMs={g.transMs} color={g.color} variant="guest" z={15} />
              ))}

            {/* workers */}
            {game.workers.map((w) => (
              <Character key={w.id} x={w.x} y={w.y} transMs={w.transMs} color={w.color} variant={w.type} z={22} />
            ))}

            {/* floaters */}
            {game.floaters.map((f) => (
              <div
                key={f.id}
                style={{
                  position: "absolute",
                  left: f.x,
                  top: f.y,
                  transform: "translate(-50%,-100%)",
                  color: "#1f7a34",
                  fontWeight: 900,
                  fontSize: 16,
                  textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                  animation: "floatUp 0.9s ease-out forwards",
                  zIndex: 30,
                  pointerEvents: "none",
                }}
              >
                +${f.amt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIDE PANEL */}
      <aside className="w-full max-w-[960px] lg:w-72 lg:shrink-0">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-md ring-1 ring-black/5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-black text-white"
            style={{ background: "#34c759" }}
            aria-hidden
          >
            $
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-2xl font-black tabular-nums text-slate-800">${game.money}</span>
            <span className="text-[11px] font-semibold text-slate-400">{game.served} guests served</span>
          </div>
        </div>

        <ShopPanel game={game} actions={actions} />

        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-slate-500 ring-1 ring-black/5">
          Tap <b>Reception</b> to check in a waiting guest. Tap a <b>room</b> to collect cash, then again to clean it.
          Hire staff to automate everything.
        </p>
      </aside>

      <style jsx global>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translate(-50%, -100%); }
          100% { opacity: 0; transform: translate(-50%, -220%); }
        }
        @keyframes bob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
