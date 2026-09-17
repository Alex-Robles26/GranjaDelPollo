/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tomados del logo de La Granja del Pollo
        campo: {
          900: "#16280F", // verde más oscuro (sombra de la cinta)
          800: "#1E3319",
          700: "#2E4A2A", // verde de la cinta principal
          600: "#3D6132",
          500: "#4E7A3A", // verde de las hojas
          300: "#8FB07A",
        },
        trigo: {
          700: "#8F6327",
          600: "#A87C3E",
          500: "#C89B5C", // banner inferior
          300: "#E0C28E",
          100: "#F2E6CE",
        },
        cresta: "#C62828", // rojo de la cresta
        yema: "#F2A93B", // naranja del pico / amanecer
        tierra: "#4A2E17", // marrón del texto "DEL POLLO"
        hueso: "#FBF8F1",
        cascara: "#F4EEE1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        titulo: ["Bitter", "Georgia", "serif"],
      },
      borderRadius: { xl2: "1.125rem" },
      boxShadow: {
        carta: "0 1px 2px rgba(22,40,15,.05)",
        panel: "0 10px 30px -12px rgba(22,40,15,.28)",
      },
    },
  },
  plugins: [],
};
