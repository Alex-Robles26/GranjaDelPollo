const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function Svg({ children, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      {children}
    </svg>
  );
}

export const Ico = {
  Inicio: (p) => (
    <Svg {...p}>
      <path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z" />
    </Svg>
  ),
  Venta: (p) => (
    <Svg {...p}>
      <path d="M4 7h16l-1.3 11.2a2 2 0 0 1-2 1.8H7.3a2 2 0 0 1-2-1.8z" />
      <path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" />
      <path d="M9.5 12.5h5" />
    </Svg>
  ),
  Inventario: (p) => (
    <Svg {...p}>
      <path d="M3.5 9.5 12 5l8.5 4.5-8.5 4.5z" />
      <path d="M3.5 14 12 18.5 20.5 14" />
      <path d="M3.5 9.5V14M20.5 9.5V14" />
    </Svg>
  ),
  Reportes: (p) => (
    <Svg {...p}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 20v-6M12.5 20V9M17 20v-9.5" />
    </Svg>
  ),
  Usuarios: (p) => (
    <Svg {...p}>
      <circle cx="9.5" cy="8.5" r="3.2" />
      <path d="M3.6 19.4c.5-3.1 3-5 5.9-5s5.4 1.9 5.9 5" />
      <path d="M16.5 6.4a3 3 0 0 1 0 5.8M18.2 14.9c2 .6 3.4 2.2 3.8 4.5" />
    </Svg>
  ),
  Perfil: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20c.6-3.7 3.5-5.9 7.2-5.9s6.6 2.2 7.2 5.9" />
    </Svg>
  ),
  Alerta: (p) => (
    <Svg {...p}>
      <path d="M12 4.2 2.9 19.3h18.2z" />
      <path d="M12 10v3.8M12 16.6h.01" />
    </Svg>
  ),
  Mas: (p) => (
    <Svg {...p}>
      <path d="M12 5.5v13M5.5 12h13" />
    </Svg>
  ),
  Salir: (p) => (
    <Svg {...p}>
      <path d="M14.5 7V5.4a1.4 1.4 0 0 0-1.4-1.4H5.9a1.4 1.4 0 0 0-1.4 1.4v13.2A1.4 1.4 0 0 0 5.9 20h7.2a1.4 1.4 0 0 0 1.4-1.4V17" />
      <path d="M9.5 12h10.3M17 9.2l2.8 2.8-2.8 2.8" />
    </Svg>
  ),
  Basura: (p) => (
    <Svg {...p}>
      <path d="M4.8 6.8h14.4M9.5 6.8V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.6" />
      <path d="M6.6 6.8 7.7 19a1.2 1.2 0 0 0 1.2 1.1h6.2a1.2 1.2 0 0 0 1.2-1.1l1.1-12.2" />
    </Svg>
  ),
  Candado: (p) => (
    <Svg {...p}>
      <rect x="4.8" y="10.2" width="14.4" height="9.4" rx="1.8" />
      <path d="M8.3 10.2V7.6a3.7 3.7 0 0 1 7.4 0v2.6" />
    </Svg>
  ),
  Check: (p) => (
    <Svg {...p}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Svg>
  ),
};
