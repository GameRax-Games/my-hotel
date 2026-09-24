"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export const TUBE_CAPACITY = 4

// Vivid, distinguishable water colors (index 0 unused = empty)
export const COLORS: string[] = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#a855f7", // purple
  "#f97316", // orange
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
  "#6366f1", // indigo
  "#f43f5e", // rose
  "#06b6d4", // cyan
]

export type Tube = number[] // bottom -> top, values are color indices

export type LevelConfig = {
  colors: number
  emptyTubes: number
}

// Difficulty scales with the level number.
function levelConfig(level: number): LevelConfig {
  const colors = Math.min(3 + Math.floor((level - 1) / 2) + ((level - 1) % 2), COLORS.length)
  // Ensure at least 3 colors, cap growth so it stays fair
  const clampedColors = Math.max(3, Math.min(colors, COLORS.length))
  const emptyTubes = clampedColors >= 8 ? 2 : 2
  return { colors: clampedColors, emptyTubes }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Serialize state to a canonical key (tube order doesn't matter for solvability)
function canonical(tubes: Tube[]): string {
  return tubes
    .map((t) => t.join(","))
    .sort()
    .join("|")
}

function isWon(tubes: Tube[]): boolean {
  return tubes.every(
    (t) => t.length === 0 || (t.length === TUBE_CAPACITY && t.every((c) => c === t[0])),
  )
}

// How many units of the top color can be poured, and the color
function topRun(tube: Tube): { color: number; count: number } | null {
  if (tube.length === 0) return null
  const color = tube[tube.length - 1]
  let count = 0
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i] === color) count++
    else break
  }
  return { color, count }
}

export function canPour(from: Tube, to: Tube): boolean {
  if (from.length === 0) return false
  if (to.length >= TUBE_CAPACITY) return false
  const run = topRun(from)
  if (!run) return false
  // No point pouring a full single-color tube into an empty one
  if (to.length === 0) {
    if (from.length === run.count && run.count === from.length && from.every((c) => c === run.color)) {
      // pouring a completed/uniform tube into empty is a wasted move
      if (from.length === TUBE_CAPACITY) return false
    }
    return true
  }
  return to[to.length - 1] === run.color
}

// Returns new tubes after pouring, or null if illegal
export function pour(tubes: Tube[], fromIdx: number, toIdx: number): Tube[] | null {
  if (fromIdx === toIdx) return null
  const from = tubes[fromIdx]
  const to = tubes[toIdx]
  if (!canPour(from, to)) return null
  const run = topRun(from)!
  const space = TUBE_CAPACITY - to.length
  const moveCount = Math.min(run.count, space)
  if (moveCount <= 0) return null
  const next = tubes.map((t) => [...t])
  for (let i = 0; i < moveCount; i++) {
    const c = next[fromIdx].pop()!
    next[toIdx].push(c)
  }
  return next
}

// Depth-first solvability check with visited memo and a node cap.
function isSolvable(start: Tube[]): boolean {
  const visited = new Set<string>()
  const stack: Tube[][] = [start]
  let nodes = 0
  const NODE_CAP = 200000
  while (stack.length) {
    const state = stack.pop()!
    if (isWon(state)) return true
    const key = canonical(state)
    if (visited.has(key)) continue
    visited.add(key)
    if (++nodes > NODE_CAP) return false
    for (let i = 0; i < state.length; i++) {
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue
        const next = pour(state, i, j)
        if (next && !visited.has(canonical(next))) {
          stack.push(next)
        }
      }
    }
  }
  return false
}

export function generateLevel(level: number): Tube[] {
  const { colors, emptyTubes } = levelConfig(level)
  for (let attempt = 0; attempt < 200; attempt++) {
    // pool of each color repeated to fill capacity
    const pool: number[] = []
    for (let c = 0; c < colors; c++) {
      for (let k = 0; k < TUBE_CAPACITY; k++) pool.push(c)
    }
    const shuffled = shuffle(pool)
    const tubes: Tube[] = []
    for (let c = 0; c < colors; c++) {
      tubes.push(shuffled.slice(c * TUBE_CAPACITY, c * TUBE_CAPACITY + TUBE_CAPACITY))
    }
    for (let e = 0; e < emptyTubes; e++) tubes.push([])
    // reject trivially-solved (already won) boards
    if (isWon(tubes)) continue
    if (isSolvable(tubes)) return tubes
  }
  // Fallback: return a guaranteed-solvable ordered board (rare)
  const tubes: Tube[] = []
  for (let c = 0; c < colors; c++) tubes.push(Array(TUBE_CAPACITY).fill(c))
  for (let e = 0; e < emptyTubes; e++) tubes.push([])
  // rotate a couple to avoid instant win
  if (tubes.length >= 2) {
    tubes[tubes.length - 1].push(tubes[0].pop()!)
  }
  return tubes
}

export type GameStatus = "playing" | "won"

export function useWaterSort() {
  const [level, setLevel] = useState(1)
  // Start empty so server and client render identically; the real board is
  // generated on the client after mount to avoid a hydration mismatch
  // (generateLevel relies on Math.random()).
  const [tubes, setTubes] = useState<Tube[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [history, setHistory] = useState<Tube[][]>([])
  const [status, setStatus] = useState<GameStatus>("playing")
  const [pouring, setPouring] = useState<{ from: number; to: number } | null>(null)
  const initialRef = useRef<Tube[]>([])

  const startLevel = useCallback((lvl: number) => {
    const fresh = generateLevel(lvl)
    initialRef.current = fresh.map((t) => [...t])
    setTubes(fresh)
    setSelected(null)
    setMoves(0)
    setHistory([])
    setStatus("playing")
    setPouring(null)
  }, [])

  const restart = useCallback(() => {
    setTubes(initialRef.current.map((t) => [...t]))
    setSelected(null)
    setMoves(0)
    setHistory([])
    setStatus("playing")
    setPouring(null)
  }, [])

  const nextLevel = useCallback(() => {
    const lvl = level + 1
    setLevel(lvl)
    startLevel(lvl)
  }, [level, startLevel])

  // Generate the first board on the client only, after mount.
  useEffect(() => {
    const fresh = generateLevel(1)
    initialRef.current = fresh.map((t) => [...t])
    setTubes(fresh)
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setTubes(prev.map((t) => [...t]))
      setMoves((m) => Math.max(0, m - 1))
      setStatus("playing")
      setSelected(null)
      return h.slice(0, -1)
    })
  }, [])

  const handleTubeClick = useCallback(
    (idx: number) => {
      if (status !== "playing" || pouring) return
      if (selected === null) {
        if (tubes[idx].length === 0) return // can't select empty
        setSelected(idx)
        return
      }
      if (selected === idx) {
        setSelected(null)
        return
      }
      const next = pour(tubes, selected, idx)
      if (next) {
        setHistory((h) => [...h, tubes.map((t) => [...t])])
        setPouring({ from: selected, to: idx })
        setTubes(next)
        setMoves((m) => m + 1)
        setSelected(null)
        if (isWon(next)) {
          setStatus("won")
        }
        window.setTimeout(() => setPouring(null), 450)
      } else {
        // invalid target: reselect if the tapped tube has contents
        if (tubes[idx].length > 0) setSelected(idx)
        else setSelected(null)
      }
    },
    [selected, tubes, status, pouring],
  )

  const hasMoves = useMemo(() => {
    for (let i = 0; i < tubes.length; i++) {
      for (let j = 0; j < tubes.length; j++) {
        if (i !== j && canPour(tubes[i], tubes[j])) return true
      }
    }
    return false
  }, [tubes])

  return {
    level,
    tubes,
    ready: tubes.length > 0,
    selected,
    moves,
    status,
    pouring,
    canUndo: history.length > 0,
    hasMoves,
    handleTubeClick,
    undo,
    restart,
    nextLevel,
  }
}
