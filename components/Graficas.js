"use client";

const W = 720;
const H = 260;
const M = { arriba: 16, derecha: 12, abajo: 34, izquierda: 56 };
const ANCHO = W - M.izquierda - M.derecha;
const ALTO = H - M.arriba - M.abajo;

function abreviar(n) {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return String(Math.round(v));
}

function escalaY(maximo) {
  const tope = maximo <= 0 ? 1 : maximo * 1.12;
  return (v) => M.arriba + ALTO - (Number(v || 0) / tope) * ALTO;
}

function Rejilla({ maximo }) {
  const y = escalaY(maximo);
  const tope = maximo <= 0 ? 1 : maximo * 1.12;
  const pasos = [0, 0.25, 0.5, 0.75, 1].map((p) => p * tope);
  return (
    <g>
      {pasos.map((v, i) => (
        <g key={i}>
          <line
            x1={M.izquierda}
            x2={W - M.derecha}
            y1={y(v)}
            y2={y(v)}
            stroke="#E0C28E"
            strokeWidth={i === 0 ? 1.4 : 1}
            strokeDasharray={i === 0 ? "" : "3 5"}
          />
          <text
            x={M.izquierda - 9}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="11"
            fill="#2E4A2A"
            opacity="0.6"
          >
            {abreviar(v)}
          </text>
        </g>
      ))}
    </g>
  );
}

function EtiquetasX({ datos }) {
  const paso = Math.ceil(datos.length / 9) || 1;
  const ancho = ANCHO / Math.max(datos.length, 1);
  return (
    <g>
      {datos.map((d, i) =>
        i % paso === 0 ? (
          <text
            key={i}
            x={M.izquierda + ancho * i + ancho / 2}
            y={H - 12}
            textAnchor="middle"
            fontSize="11"
            fill="#2E4A2A"
            opacity="0.6"
          >
            {d.etiqueta}
          </text>
        ) : null
      )}
    </g>
  );
}

/** Barras agrupadas: ingresos frente a costos. */
export function GraficoBarras({ datos, series }) {
  if (!datos?.length) return null;
  const maximo = Math.max(
    ...datos.flatMap((d) => d.valores.map((v) => Number(v || 0))),
    0
  );
  const y = escalaY(maximo);
  const anchoGrupo = ANCHO / datos.length;
  const anchoBarra = Math.max(
    3,
    Math.min(22, (anchoGrupo * 0.62) / series.length)
  );
  const base = M.arriba + ALTO;

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        <Rejilla maximo={maximo} />
        {datos.map((d, i) => {
          const centro = M.izquierda + anchoGrupo * i + anchoGrupo / 2;
          const inicio = centro - (anchoBarra * series.length) / 2;
          return (
            <g key={i}>
              {d.valores.map((v, j) => {
                const altura = Math.max(0, base - y(v));
                return (
                  <rect
                    key={j}
                    x={inicio + anchoBarra * j}
                    y={base - altura}
                    width={anchoBarra - 1.5}
                    height={altura}
                    rx="2.5"
                    fill={series[j].color}
                  >
                    <title>{`${d.etiqueta} · ${series[j].nombre}: ${Math.round(v)}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
        <EtiquetasX datos={datos} />
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-4 text-[13px] text-campo-800/70">
        {series.map((s) => (
          <span key={s.nombre} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            {s.nombre}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/** Línea con área: evolución de la ganancia. */
export function GraficoLinea({ datos, color = "#2E4A2A", nombre = "Ganancia" }) {
  if (!datos?.length) return null;
  const valores = datos.map((d) => Number(d.valor || 0));
  const maximo = Math.max(...valores, 0);
  const y = escalaY(maximo);
  const paso = datos.length > 1 ? ANCHO / (datos.length - 1) : 0;
  const px = (i) => (datos.length > 1 ? M.izquierda + paso * i : M.izquierda + ANCHO / 2);

  const linea = datos.map((d, i) => `${i ? "L" : "M"}${px(i)} ${y(d.valor)}`).join(" ");
  const area = `${linea} L${px(datos.length - 1)} ${M.arriba + ALTO} L${px(0)} ${
    M.arriba + ALTO
  } Z`;

  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
        <defs>
          <linearGradient id="degradadoGanancia" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <Rejilla maximo={maximo} />
        <path d={area} fill="url(#degradadoGanancia)" />
        <path
          d={linea}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {datos.map((d, i) => (
          <circle key={i} cx={px(i)} cy={y(d.valor)} r="3.4" fill="#FBF8F1" stroke={color} strokeWidth="2">
            <title>{`${d.etiqueta}: ${Math.round(d.valor)}`}</title>
          </circle>
        ))}
        <EtiquetasX datos={datos} />
      </svg>
      <figcaption className="mt-2 text-[13px] text-campo-800/70">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
          {nombre}
        </span>
      </figcaption>
    </figure>
  );
}
