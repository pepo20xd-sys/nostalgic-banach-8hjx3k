import { useState, useEffect, useRef } from "react";

const LEVELS = [
  { key: "red", bg: "#ef4444", text: "#fff", label: "No sabe", score: 0 },
  {
    key: "orange",
    bg: "#f97316",
    text: "#fff",
    label: "Practicado, aún no sabe",
    score: 1,
  },
  {
    key: "yellow",
    bg: "#facc15",
    text: "#333",
    label: "Sabe pero no fluido",
    score: 2,
  },
  { key: "green", bg: "#22c55e", text: "#fff", label: "Sabe fluido", score: 3 },
  {
    key: "white",
    bg: "#f8fafc",
    text: "#333",
    label: "Sabe por voz",
    score: 4,
    border: true,
  },
  {
    key: "purple",
    bg: "#a855f7",
    text: "#fff",
    label: "Caso especial",
    score: 4,
  },
];

const THEMES = {
  verde: {
    name: "Clásico Verde",
    body: "#f0fdf4",
    card: "#fff",
    accent: "#16a34a",
    text: "#14532d",
    border: "#bbf7d0",
  },
  oscuro: {
    name: "Modo Oscuro",
    body: "#0f172a",
    card: "#1e293b",
    accent: "#38bdf8",
    text: "#f1f5f9",
    border: "#334155",
  },
  blanco: {
    name: "Minimalista",
    body: "#ffffff",
    card: "#f9fafb",
    accent: "#111827",
    text: "#111827",
    border: "#e5e7eb",
  },
  sunset: {
    name: "Atardecer",
    body: "#fff7ed",
    card: "#fff",
    accent: "#ea580c",
    text: "#7c2d12",
    border: "#fed7aa",
  },
};

const LM = Object.fromEntries(LEVELS.map((l) => [l.key, l]));
const LK = LEVELS.map((l) => l.key);
const EMPTY = "red";

const DEFAULT_TEMARIOS = {
  "Básicos 1": [
    "Sentarse",
    "Echarse",
    "Quedarse",
    "Venir",
    "Junto",
    "No / Quieto",
    "Suelta",
    "Deja",
  ],
  "Básicos 2": ["Pata", "La otra", "Gira", "Rodar", "Saluda", "Choca"],
  Intermedio: [
    "Busca",
    "Trae",
    "Lugar",
    "Espera en puerta",
    "Salto",
    "Por debajo",
  ],
  Avanzado: [
    "Muerto",
    "Equilibrio",
    "Vergüenza",
    "Caminar atrás",
    "Entre piernas",
    "Abrazo",
  ],
  Utilidad: ["Cerrar", "Luces", "Limpiar", "Trae correo", "Abre cajón"],
};

function calcScore(dogs, tricks, progress) {
  return dogs.map((dog) => {
    let tot = 0,
      max = tricks.length * 4;
    tricks.forEach((t) => {
      tot += LM[progress[dog]?.[t] ?? EMPTY]?.score ?? 0;
    });
    return { dog, tot, max, pct: max > 0 ? Math.round((tot / max) * 100) : 0 };
  });
}

function ScoreBadge({ pct }) {
  const c =
    pct >= 80
      ? "#22c55e"
      : pct >= 50
      ? "#eab308"
      : pct >= 25
      ? "#f97316"
      : "#ef4444";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        background: c,
        color: "#fff",
        fontWeight: 700,
        fontSize: 10,
      }}
    >
      {pct}%
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState(null);
  const [themeKey, setThemeKey] = useState("verde");
  const [temarios, setTemarios] = useState(DEFAULT_TEMARIOS);
  const [tabOrder, setTabOrder] = useState(Object.keys(DEFAULT_TEMARIOS));
  const [dogs, setDogs] = useState(["Rex"]);
  const [locked, setLocked] = useState({});
  const [progress, setProgress] = useState({});
  const [histLog, setHistLog] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [editTricksOpen, setEditTricksOpen] = useState(false);
  const [editingTricks, setEditingTricks] = useState([]);
  const [newTabOpen, setNewTabOpen] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [newTrickInput, setNewTrickInput] = useState("");
  const [newDog, setNewDog] = useState("");

  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const T = THEMES[themeKey];

  useEffect(() => {
    try {
      const d = localStorage.getItem("dogs_v3"),
        p = localStorage.getItem("progress_v3"),
        tm = localStorage.getItem("temarios_v3"),
        th = localStorage.getItem("theme_v3"),
        hl = localStorage.getItem("histlog_v3");
      if (d) setDogs(JSON.parse(d));
      if (p) setProgress(JSON.parse(p));
      if (tm) setTemarios(JSON.parse(tm));
      if (th) setThemeKey(th);
      if (hl) setHistLog(JSON.parse(hl));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("dogs_v3", JSON.stringify(dogs));
    localStorage.setItem("progress_v3", JSON.stringify(progress));
    localStorage.setItem("theme_v3", themeKey);
    localStorage.setItem("histlog_v3", JSON.stringify(histLog));
  }, [dogs, progress, themeKey, histLog, loaded]);

  useEffect(() => {
    if (!tab || !Object.keys(temarios).includes(tab))
      setTab(Object.keys(temarios)[0]);
  }, [temarios, tab]);

  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const tricks = tab ? temarios[tab] ?? [] : [];
  const scores = calcScore(dogs, tricks, progress);
  const B = {
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 12,
    padding: "8px 12px",
  };

  function cycleCell(dog, trick) {
    if (locked[dog]) return;
    const cur = progress[dog]?.[trick] ?? EMPTY,
      next = LK[(LK.indexOf(cur) + 1) % LK.length];
    setProgress((p) => ({ ...p, [dog]: { ...(p[dog] ?? {}), [trick]: next } }));
  }

  return (
    <div
      style={{
        fontFamily: "'Segoe UI',sans-serif",
        background: T.body,
        minHeight: "100vh",
        padding: "10px",
        transition: "all 0.3s ease",
        color: T.text,
      }}
    >
      {/* Título y Disparador de Tema */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          onClick={() => setShowThemeModal(true)}
          style={{
            fontSize: 35,
            cursor: "pointer",
            display: "inline-block",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        >
          🐾
        </div>
        <h1
          style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T.accent }}
        >
          Dog Tracker Pro
        </h1>
      </div>

      {/* Barra de Tabs con Drag-to-Scroll */}
      <div style={{ position: "relative", marginBottom: 15 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 40,
            background: `linear-gradient(to right, ${T.body}, transparent)`,
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 40,
            background: `linear-gradient(to left, ${T.body}, transparent)`,
            zIndex: 2,
          }}
        />
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={() => (isDragging.current = false)}
          onMouseUp={() => (isDragging.current = false)}
          onMouseMove={(e) => {
            if (!isDragging.current) return;
            const x = e.pageX - scrollRef.current.offsetLeft;
            scrollRef.current.scrollLeft =
              scrollLeft.current - (x - startX.current) * 1.5;
          }}
          style={{
            overflowX: "hidden",
            padding: "5px 25px",
            display: "flex",
            gap: 8,
            cursor: "grab",
          }}
        >
          {Object.keys(temarios).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...B,
                whiteSpace: "nowrap",
                borderRadius: 20,
                background: tab === t ? T.accent : T.card,
                color: tab === t ? "#fff" : T.text,
                border: `2px solid ${T.border}`,
                transition: "0.2s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar Inferior */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: 15,
        }}
      >
        <input
          value={newDog}
          onChange={(e) => setNewDog(e.target.value)}
          placeholder="Perro..."
          style={{
            padding: 8,
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            outline: "none",
            width: 100,
          }}
        />
        <button
          onClick={() => {
            if (newDog) {
              setDogs([...dogs, newDog]);
              setNewDog("");
            }
          }}
          style={{ ...B, background: T.accent, color: "#fff" }}
        >
          + Perro
        </button>
        <button
          onClick={() => {
            setEditingTricks(temarios[tab] || []);
            setEditTricksOpen(true);
          }}
          style={{
            ...B,
            background: T.card,
            color: T.text,
            border: `1px solid ${T.border}`,
          }}
        >
          ✏️ Trucos
        </button>
        <button
          onClick={() => setNewTabOpen(true)}
          style={{
            ...B,
            background: T.card,
            color: T.text,
            border: `1px dashed ${T.accent}`,
          }}
        >
          + Tabla
        </button>
      </div>

      {/* Tabla Principal */}
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            overflowX: "auto",
            background: T.card,
            borderRadius: 15,
            border: `1px solid ${T.border}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.accent, color: "#fff" }}>
                <th style={{ padding: 12, textAlign: "left" }}>{tab}</th>
                {dogs.map((dog) => (
                  <th key={dog} style={{ padding: 8, fontSize: 11 }}>
                    {dog}
                    <div
                      style={{
                        display: "flex",
                        gap: 2,
                        justifyContent: "center",
                        marginTop: 4,
                      }}
                    >
                      <button
                        onClick={() =>
                          setLocked({ ...locked, [dog]: !locked[dog] })
                        }
                        style={{
                          background: "#fff3",
                          border: "none",
                          borderRadius: 4,
                          color: "#fff",
                          fontSize: 8,
                        }}
                      >
                        {locked[dog] ? "🔓" : "🔒"}
                      </button>
                      <button
                        onClick={() => setDogs(dogs.filter((d) => d !== dog))}
                        style={{
                          background: "#fff3",
                          border: "none",
                          borderRadius: 4,
                          color: "#fff",
                          fontSize: 8,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tricks.map((trick, i) => (
                <tr
                  key={trick}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    background:
                      i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
                  }}
                >
                  <td style={{ padding: "12px 15px", fontSize: 13 }}>
                    {trick}
                  </td>
                  {dogs.map((dog) => {
                    const lvl = LM[progress[dog]?.[trick] ?? EMPTY];
                    return (
                      <td key={dog} style={{ textAlign: "center", padding: 5 }}>
                        <button
                          onClick={() => cycleCell(dog, trick)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: lvl.bg,
                            color: lvl.text,
                            border: "none",
                            fontWeight: 700,
                            opacity: locked[dog] ? 0.4 : 1,
                          }}
                        >
                          {lvl.score}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: 10 }}>
                  <button
                    onClick={() => {
                      const date = new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      setHistLog([
                        {
                          id: Date.now(),
                          tab,
                          date,
                          data: scores.map((s) => ({ dog: s.dog, pct: s.pct })),
                        },
                        ...histLog,
                      ]);
                    }}
                    style={{
                      ...B,
                      background: T.accent,
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    💾 GUARDAR REGISTRO
                  </button>
                </td>
                {scores.map((s) => (
                  <td key={s.dog} style={{ textAlign: "center" }}>
                    <ScoreBadge pct={s.pct} />
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Historial Corto */}
        <div style={{ marginTop: 10, padding: 10 }}>
          {histLog
            .filter((h) => h.tab === tab)
            .slice(0, 3)
            .map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  background: T.card,
                  padding: 8,
                  borderRadius: 10,
                  marginBottom: 5,
                  border: `1px solid ${T.border}`,
                  fontSize: 11,
                }}
              >
                <span>{h.date}</span>
                <div style={{ display: "flex", gap: 10 }}>
                  {h.data.map((d) => (
                    <div key={d.dog}>
                      {d.dog}: <ScoreBadge pct={d.pct} />
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setHistLog(histLog.filter((x) => x.id !== h.id))
                    }
                    style={{
                      border: "none",
                      background: "none",
                      color: "#f87171",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL SELECTOR DE TEMA */}
      {showThemeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowThemeModal(false)}
        >
          <div
            style={{
              background: T.card,
              padding: 25,
              borderRadius: 20,
              width: 280,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, color: T.text }}>Elige un estilo</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    setThemeKey(key);
                    setShowThemeModal(false);
                  }}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `2px solid ${theme.border}`,
                    background: theme.body,
                    color: theme.text,
                    fontWeight: "bold",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: theme.accent }}>●</span> {theme.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OTROS MODALES (Simplificados) */}
      {newTabOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ background: T.card, padding: 20, borderRadius: 15 }}>
            <input
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder="Nombre..."
              style={{ padding: 10, border: `1px solid ${T.border}` }}
            />
            <button
              onClick={() => {
                if (newTabName) {
                  setTemarios({ ...temarios, [newTabName]: [] });
                  setNewTabOpen(false);
                }
              }}
              style={{
                ...B,
                background: T.accent,
                color: "#fff",
                marginLeft: 5,
              }}
            >
              Crear
            </button>
          </div>
        </div>
      )}

      {editTricksOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: T.card,
              padding: 20,
              borderRadius: 15,
              width: 300,
            }}
          >
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {editingTricks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  {t}{" "}
                  <button
                    onClick={() =>
                      setEditingTricks(editingTricks.filter((_, j) => j !== i))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <input
              value={newTrickInput}
              onChange={(e) => setNewTrickInput(e.target.value)}
              placeholder="Truco..."
              style={{ width: "100%", marginTop: 10 }}
            />
            <button
              onClick={() =>
                setEditingTricks([...editingTricks, newTrickInput])
              }
            >
              +
            </button>
            <button
              onClick={() => {
                setTemarios({ ...temarios, [tab]: editingTricks });
                setEditTricksOpen(false);
              }}
              style={{
                width: "100%",
                marginTop: 10,
                background: T.accent,
                color: "#fff",
                border: "none",
                padding: 10,
                borderRadius: 8,
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
