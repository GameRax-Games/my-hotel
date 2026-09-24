"use client"

interface CharacterProps {
  x: number
  y: number
  transMs: number
  color: string
  variant: "manager" | "reception" | "bellhop" | "cleaner" | "guest"
  z?: number
}

const LABEL: Record<CharacterProps["variant"], string> = {
  manager: "You",
  reception: "Receptionist",
  bellhop: "Bellhop",
  cleaner: "Cleaner",
  guest: "Guest",
}

export function Character({ x, y, transMs, color, variant, z = 20 }: CharacterProps) {
  const isGuest = variant === "guest"
  return (
    <div
      aria-label={LABEL[variant]}
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        transition: `left ${transMs}ms linear, top ${transMs}ms linear`,
        zIndex: z,
        pointerEvents: "none",
        willChange: "left, top",
      }}
    >
      {/* shadow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: -6,
          transform: "translateX(-50%)",
          width: 26,
          height: 8,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.18)",
        }}
      />
      <div style={{ position: "relative", width: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* head */}
        <div
          style={{
            width: 15,
            height: 15,
            borderRadius: "50%",
            background: "#f6d2a9",
            border: "2px solid rgba(0,0,0,0.12)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* hair / cap */}
          <div
            style={{
              position: "absolute",
              top: -3,
              left: -1,
              width: 15,
              height: 8,
              borderRadius: "8px 8px 4px 4px",
              background: isGuest ? "#4b3a2f" : color,
            }}
          />
        </div>
        {/* body */}
        <div
          style={{
            marginTop: -2,
            width: 22,
            height: 22,
            borderRadius: "10px 10px 7px 7px",
            background: color,
            border: "2px solid rgba(0,0,0,0.12)",
          }}
        />
        {/* legs */}
        <div style={{ display: "flex", gap: 3, marginTop: -2 }}>
          <div style={{ width: 6, height: 8, background: "#3a3a3a", borderRadius: "0 0 3px 3px" }} />
          <div style={{ width: 6, height: 8, background: "#3a3a3a", borderRadius: "0 0 3px 3px" }} />
        </div>
        {/* luggage for guests */}
        {isGuest && (
          <div
            style={{
              position: "absolute",
              right: -10,
              bottom: 6,
              width: 11,
              height: 14,
              borderRadius: 3,
              background: "#a9714b",
              border: "2px solid rgba(0,0,0,0.15)",
            }}
          />
        )}
      </div>
    </div>
  )
}
