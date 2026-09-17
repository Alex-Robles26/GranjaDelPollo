import "./globals.css";

export const metadata = {
  title: "La Granja del Pollo — Control de huevos",
  description:
    "Inventario, ventas y ganancias del negocio de huevos de La Granja del Pollo.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export const viewport = {
  themeColor: "#2E4A2A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bitter:wght@600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
