"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/* ---------- World geometry ---------- */
export const WORLD_W = 960
export const WORLD_H = 640
export const GROUND_Y = 545 // foot line of the lobby
export const FLOOR_H = 118
export const SHAFT_X = 92
export const ROOM_XS = [220, 375, 530]
export const ROOM_W = 132
export const ROOM_H = 94
export const ENTRANCE_X = 912
export const BUILD_LEFT = 40
export const BUILD_RIGHT = 606
export const QUEUE_X0 = 300
export const QUEUE_GAP = 42
export const RECEPTION_X = 176

export const floorFootY = (visualFloor: number) => GROUND_Y - visualFloor * FLOOR_H

/* ---------- Tunables ---------- */
const STAY_MS = 13000
const SPAWN_MS = 2500
const MAX_WAITING = 5
const CASH_STEP_MS = 550
const CASH_CAP_MULT = 8
const COLLECT_MS = 200
const CLEAN_MS = 700
const AUTO_COLLECT_MULT = 2

const GUEST_COLORS = ["#ef6f6c", "#f4a259", "#6fb3d2", "#8367c7", "#5b8e7d", "#e28ec0", "#f2c14e", "#7dc1a2"]
const DOOR_COLORS = ["#ef6f6c", "#f4a259", "#5b8e7d", "#8367c7", "#4a90d9", "#e28ec0", "#f2c14e", "#7dc1a2", "#c0705a"]

/* ---------- Types ---------- */
interface Mover {
  x: number
  y: number
  transMs: number
  segEnd: number
  path: { x: number; y: number }[]
  moving: boolean
}
export interface Worker extends Mover {
  id: number
  type: "manager" | "reception" | "bellhop" | "cleaner"
  baseSpeed: number
  home: number
  color: string
  acting: boolean
  actEnd: number
  task: Task | null
}
export interface Guest extends Mover {
  id: number
  seq: number
  state: "waiting" | "escorting" | "inRoom" | "leaving"
  assigned: boolean
  color: string
}
export interface Room {
  idx: number
  state: "empty" | "occupied" | "dirty"
  cash: number
  cashAcc: number
  stay: number
  guestId: number | null
  escorting: boolean
  collecting: boolean
  cleaning: boolean
  x: number
  footY: number
  doorColor: string
}
export interface Task {
  id: number
  type: "escort" | "collect" | "clean"
  roomId: number
  guestId: number | null
  phase: "toGuest" | "toRoom"
  claimed: boolean
  worker: number | null
}
export interface Floater {
  id: number
  x: number
  y: number
  amt: number
  born: number
}
export interface Game {
  money: number
  price: number
  rateLevel: number
  speedLevel: number
  speedMul: number
  seq: number
  lastNow: number
  spawnAcc: number
  rooms: Room[]
  guests: Guest[]
  workers: Worker[]
  tasks: Task[]
  floaters: Floater[]
  hasReception: boolean
  hasBellhop: boolean
  hasCleaner: boolean
  served: number
}

/* ---------- Cost helpers ---------- */
export const costs = {
  room: (g: Game) => Math.floor(30 * Math.pow(1.55, g.rooms.length - 2)),
  rate: (g: Game) => Math.floor(45 * Math.pow(1.7, g.rateLevel)),
  speed: (g: Game) => Math.floor(80 * Math.pow(1.8, g.speedLevel)),
  reception: 130,
  bellhop: 160,
  cleaner: 90,
}

/* ---------- Geometry helpers ---------- */
function roomGeometry(idx: number) {
  const vf = Math.floor(idx / 3) + 1
  const pos = idx % 3
  return { x: ROOM_XS[pos], footY: floorFootY(vf) }
}

function makeRoom(idx: number): Room {
  const { x, footY } = roomGeometry(idx)
  return {
    idx,
    state: "empty",
    cash: 0,
    cashAcc: 0,
    stay: 0,
    guestId: null,
    escorting: false,
    collecting: false,
    cleaning: false,
    x,
    footY,
    doorColor: DOOR_COLORS[idx % DOOR_COLORS.length],
  }
}

function route(fx: number, fy: number, tx: number, ty: number) {
  const w: { x: number; y: number }[] = []
  if (Math.abs(fy - ty) > 1) {
    if (Math.abs(fx - SHAFT_X) > 1) w.push({ x: SHAFT_X, y: fy })
    w.push({ x: SHAFT_X, y: ty })
    w.push({ x: tx, y: ty })
  } else {
    w.push({ x: tx, y: ty })
  }
  return w
}

function sendTo(m: Mover, tx: number, ty: number, now: number) {
  m.path = route(m.x, m.y, tx, ty)
  m.moving = true
  m.segEnd = now - 1
}

// advances a mover one step; returns true on the tick it arrives
function stepMover(m: Mover, now: number, speed: number): boolean {
  if (!m.moving) return false
  if (now >= m.segEnd) {
    if (m.path.length) {
      const wp = m.path.shift()!
      const d = Math.hypot(wp.x - m.x, wp.y - m.y)
      const dur = Math.max(140, d / speed)
      m.x = wp.x
      m.y = wp.y
      m.transMs = dur
      m.segEnd = now + dur
      return false
    }
    m.moving = false
    return true
  }
  return false
}

function makeWorker(g: Game, type: Worker["type"]): Worker {
  const cfg = {
    manager: { home: 255, color: "#2d6cdf", speed: 0.34 },
    reception: { home: 200, color: "#d94f9a", speed: 0.3 },
    bellhop: { home: 138, color: "#f0a020", speed: 0.32 },
    cleaner: { home: 108, color: "#35b0a7", speed: 0.32 },
  }[type]
  return {
    id: g.seq++,
    type,
    x: cfg.home,
    y: GROUND_Y,
    transMs: 0,
    segEnd: 0,
    path: [],
    moving: false,
    baseSpeed: cfg.speed,
    home: cfg.home,
    color: cfg.color,
    acting: false,
    actEnd: 0,
    task: null,
  }
}

function createGame(): Game {
  const g: Game = {
    money: 0,
    price: 12,
    rateLevel: 0,
    speedLevel: 0,
    speedMul: 1,
    seq: 1,
    lastNow: 0,
    spawnAcc: SPAWN_MS,
    rooms: [makeRoom(0), makeRoom(1)],
    guests: [],
    workers: [],
    tasks: [],
    floaters: [],
    hasReception: false,
    hasBellhop: false,
    hasCleaner: false,
    served: 0,
  }
  g.workers.push(makeWorker(g, "manager"))
  return g
}

/* ---------- Queries ---------- */
const frontWaiting = (g: Game) =>
  g.guests
    .filter((gs) => gs.state === "waiting" && !gs.assigned)
    .sort((a, b) => a.seq - b.seq)[0]

const firstEmptyRoom = (g: Game) =>
  g.rooms.filter((r) => r.state === "empty" && !r.escorting).sort((a, b) => a.idx - b.idx)[0]

const findGuest = (g: Game, id: number | null) => g.guests.find((gs) => gs.id === id)

/* ---------- Task creation ---------- */
function createEscort(g: Game, guest: Guest, room: Room) {
  room.escorting = true
  guest.assigned = true
  g.tasks.push({
    id: g.seq++,
    type: "escort",
    roomId: room.idx,
    guestId: guest.id,
    phase: "toGuest",
    claimed: false,
    worker: null,
  })
}
function createCollect(g: Game, room: Room) {
  room.collecting = true
  g.tasks.push({ id: g.seq++, type: "collect", roomId: room.idx, guestId: null, phase: "toRoom", claimed: false, worker: null })
}
function createClean(g: Game, room: Room) {
  room.cleaning = true
  g.tasks.push({ id: g.seq++, type: "clean", roomId: room.idx, guestId: null, phase: "toRoom", claimed: false, worker: null })
}

function capable(wtype: Worker["type"], ttype: Task["type"]) {
  if (wtype === "manager") return true
  if (wtype === "reception") return ttype === "escort"
  if (wtype === "bellhop") return ttype === "collect"
  if (wtype === "cleaner") return ttype === "clean"
  return false
}

function taskPos(g: Game, t: Task) {
  if (t.type === "escort" && t.phase === "toGuest") {
    const guest = findGuest(g, t.guestId)
    if (guest) return { x: guest.x, y: guest.y }
  }
  const room = g.rooms[t.roomId]
  return { x: room.x, y: room.footY }
}

function finishTask(g: Game, w: Worker) {
  if (w.task) g.tasks = g.tasks.filter((t) => t.id !== w.task!.id)
  w.task = null
}

function addFloater(g: Game, x: number, y: number, amt: number) {
  g.floaters.push({ id: g.seq++, x, y, amt, born: g.lastNow })
}

/* ---------- Arrival / action resolution ---------- */
function onArrive(g: Game, w: Worker, now: number) {
  const t = w.task
  if (!t) return
  const room = g.rooms[t.roomId]

  if (t.type === "escort") {
    if (t.phase === "toGuest") {
      const guest = findGuest(g, t.guestId)
      if (!guest || guest.state !== "waiting") {
        if (room) room.escorting = false
        finishTask(g, w)
        return
      }
      guest.state = "escorting"
      t.phase = "toRoom"
      sendTo(w, room.x, room.footY, now)
      sendTo(guest, room.x, room.footY, now)
      return
    }
    // arrived at room with guest
    const guest = findGuest(g, t.guestId)
    room.state = "occupied"
    room.guestId = t.guestId
    room.stay = STAY_MS
    room.cash = 0
    room.cashAcc = 0
    room.escorting = false
    if (guest) {
      guest.state = "inRoom"
      guest.moving = false
    }
    finishTask(g, w)
    return
  }

  // collect / clean -> short act
  w.acting = true
  w.actEnd = now + (t.type === "collect" ? COLLECT_MS : CLEAN_MS)
}

function finalizeActing(g: Game, w: Worker) {
  const t = w.task
  if (!t) {
    w.acting = false
    return
  }
  const room = g.rooms[t.roomId]
  if (t.type === "collect") {
    const amt = room.cash
    g.money += amt
    if (amt > 0) addFloater(g, room.x, room.footY - ROOM_H - 6, amt)
    room.cash = 0
    room.collecting = false
  } else if (t.type === "clean") {
    room.state = "empty"
    room.cleaning = false
  }
  w.acting = false
  finishTask(g, w)
}

/* ---------- Main update ---------- */
function updateGame(g: Game, now: number) {
  const dt = g.lastNow === 0 ? 0 : Math.min(220, now - g.lastNow)
  g.lastNow = now

  /* spawn guests */
  g.spawnAcc += dt
  const waiting = g.guests.filter((gs) => gs.state === "waiting").length
  if (g.spawnAcc >= SPAWN_MS && g.rooms.length > 0 && waiting < MAX_WAITING) {
    g.spawnAcc = 0
    g.guests.push({
      id: g.seq++,
      seq: g.seq,
      state: "waiting",
      assigned: false,
      color: GUEST_COLORS[Math.floor(Math.random() * GUEST_COLORS.length)],
      x: ENTRANCE_X,
      y: GROUND_Y,
      transMs: 0,
      segEnd: 0,
      path: [],
      moving: false,
    })
  }

  /* rooms: cash + stay */
  for (const r of g.rooms) {
    if (r.state === "occupied") {
      const cap = g.price * CASH_CAP_MULT
      r.cashAcc += dt
      while (r.cashAcc >= CASH_STEP_MS && r.cash < cap) {
        r.cash += g.price
        r.cashAcc -= CASH_STEP_MS
      }
      r.stay -= dt
      if (r.stay <= 0) {
        const guest = findGuest(g, r.guestId)
        if (guest) {
          guest.state = "leaving"
          guest.x = r.x
          guest.y = r.footY
          sendTo(guest, ENTRANCE_X, GROUND_Y, now)
        }
        r.state = "dirty"
        r.guestId = null
        g.served += 1
      }
    }
  }

  /* auto task creation from hired staff */
  if (g.hasReception) {
    let guard = 0
    while (guard++ < 8) {
      const guest = frontWaiting(g)
      const room = firstEmptyRoom(g)
      if (guest && room) createEscort(g, guest, room)
      else break
    }
  }
  if (g.hasBellhop) {
    for (const r of g.rooms) {
      if (r.cash >= g.price * AUTO_COLLECT_MULT && !r.collecting) createCollect(g, r)
    }
  }
  if (g.hasCleaner) {
    for (const r of g.rooms) {
      if (r.state === "dirty" && r.cash === 0 && !r.cleaning) createClean(g, r)
    }
  }

  /* queue targeting for waiting guests */
  const line = g.guests.filter((gs) => gs.state === "waiting").sort((a, b) => a.seq - b.seq)
  line.forEach((gs, rank) => {
    const desired = QUEUE_X0 + rank * QUEUE_GAP
    if (!gs.moving && Math.abs(gs.x - desired) > 3) sendTo(gs, desired, GROUND_Y, now)
  })

  /* claim tasks to available workers */
  for (const w of g.workers) {
    if (w.task || w.acting) continue
    let best: Task | null = null
    let bestD = Infinity
    for (const t of g.tasks) {
      if (t.claimed || !capable(w.type, t.type)) continue
      const p = taskPos(g, t)
      const d = Math.hypot(p.x - w.x, p.y - w.y)
      if (d < bestD) {
        bestD = d
        best = t
      }
    }
    if (best) {
      best.claimed = true
      best.worker = w.id
      w.task = best
      const p = taskPos(g, best)
      sendTo(w, p.x, p.y, now)
    }
  }

  /* step workers */
  for (const w of g.workers) {
    if (w.acting) {
      if (now >= w.actEnd) finalizeActing(g, w)
      continue
    }
    const arrived = stepMover(w, now, w.baseSpeed * g.speedMul)
    if (arrived) {
      if (w.task) onArrive(g, w, now)
      // idle with no task: rest at home
    }
    if (!w.task && !w.moving && !w.acting && Math.abs(w.x - w.home) > 4) {
      sendTo(w, w.home, GROUND_Y, now)
    }
  }

  /* step guests */
  const guestSpeed = 0.26
  for (const gs of g.guests) {
    if (gs.state === "inRoom") continue
    const arrived = stepMover(gs, now, guestSpeed)
    if (arrived && gs.state === "leaving") gs.id = -Math.abs(gs.id) // mark for removal
  }
  g.guests = g.guests.filter((gs) => gs.id > 0)

  /* expire floaters */
  g.floaters = g.floaters.filter((f) => now - f.born < 900)
}

/* ---------- Hook ---------- */
export function useHotelGame() {
  const gameRef = useRef<Game | null>(null)
  if (!gameRef.current) gameRef.current = createGame()
  const [, setTick] = useState(0)

  const step = useCallback((now: number) => {
    updateGame(gameRef.current!, now)
  }, [])

  useEffect(() => {
    let raf = 0
    let mounted = true
    const loop = () => {
      if (!mounted) return
      step(performance.now())
      setTick((t) => (t + 1) % 1_000_000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      mounted = false
      cancelAnimationFrame(raf)
    }
  }, [step])

  const bump = () => setTick((t) => (t + 1) % 1_000_000)

  const onTapRoom = useCallback((idx: number) => {
    const g = gameRef.current!
    const r = g.rooms[idx]
    if (!r) return
    if (r.cash > 0 && !r.collecting) createCollect(g, r)
    else if (r.state === "dirty" && !r.cleaning) createClean(g, r)
    else if (r.state === "empty" && !r.escorting) {
      const guest = frontWaiting(g)
      if (guest) createEscort(g, guest, r)
    }
    bump()
  }, [])

  const onTapReception = useCallback(() => {
    const g = gameRef.current!
    const guest = frontWaiting(g)
    const room = firstEmptyRoom(g)
    if (guest && room) createEscort(g, guest, room)
    bump()
  }, [])

  const buyRoom = useCallback(() => {
    const g = gameRef.current!
    const c = costs.room(g)
    if (g.money < c) return
    g.money -= c
    g.rooms.push(makeRoom(g.rooms.length))
    bump()
  }, [])

  const upgradeRate = useCallback(() => {
    const g = gameRef.current!
    const c = costs.rate(g)
    if (g.money < c) return
    g.money -= c
    g.price += 3
    g.rateLevel += 1
    bump()
  }, [])

  const upgradeSpeed = useCallback(() => {
    const g = gameRef.current!
    const c = costs.speed(g)
    if (g.money < c) return
    g.money -= c
    g.speedMul *= 1.18
    g.speedLevel += 1
    bump()
  }, [])

  const hire = useCallback((type: "reception" | "bellhop" | "cleaner") => {
    const g = gameRef.current!
    const c = costs[type]
    const flag = type === "reception" ? "hasReception" : type === "bellhop" ? "hasBellhop" : "hasCleaner"
    if (g[flag] || g.money < c) return
    g.money -= c
    g[flag] = true
    g.workers.push(makeWorker(g, type))
    bump()
  }, [])

  return {
    game: gameRef.current,
    actions: { onTapRoom, onTapReception, buyRoom, upgradeRate, upgradeSpeed, hire },
  }
}
