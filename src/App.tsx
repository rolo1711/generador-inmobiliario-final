import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type Operacion = "" | "Venta" | "Alquiler" | "Traspaso";

const TIPOS = [
"Departamento",
"Casa",
"Oficina",
"Local comercial",
"Terreno",
"Dúplex",
"Penthouse",
] as const;

const OPERACIONES: Operacion[] = ["Venta", "Alquiler", "Traspaso"];

const DISTRITOS = [
"Ancón",
"Ate",
"Barranco",
"Breña",
"Carabayllo",
"Chaclacayo",
"Chorrillos",
"Cieneguilla",
"Comas",
"El Agustino",
"Independencia",
"Jesús María",
"La Molina",
"La Victoria",
"Lima (Cercado)",
"Lince",
"Los Olivos",
"Lurigancho - Chosica",
"Lurín",
"Magdalena del Mar",
"Miraflores",
"Pachacámac",
"Pucusana",
"Pueblo Libre",
"Puente Piedra",
"Punta Hermosa",
"Punta Negra",
"Rímac",
"San Bartolo",
"San Borja",
"San Isidro",
"San Juan de Lurigancho",
"San Juan de Miraflores",
"San Luis",
"San Martín de Porres",
"San Miguel",
"Santa Anita",
"Santa María del Mar",
"Santa Rosa",
"Santiago de Surco",
"Surquillo",
"Villa El Salvador",
"Villa María del Triunfo",
] as const;

const DESC_DISTRITO: Record<string, string> = {
Miraflores:
"ubicado en el moderno y turístico distrito de Miraflores, con excelente gastronomía y cercanía a zonas icónicas",
Barranco:
"ubicado en el bohemio y costero distrito de Barranco, reconocido por su ambiente cultural y artístico",
"San Isidro":
"ubicado en el exclusivo distrito de San Isidro, corazón financiero y corporativo de la ciudad",
"Santiago de Surco":
"ubicado en el residencial distrito de Santiago de Surco, ideal para familias y con gran conectividad",
Surquillo:
"ubicado en el distrito de Surquillo, con acceso rápido a Miraflores, Surco y principales avenidas",
"Magdalena del Mar":
"ubicado en el acogedor y costero distrito de Magdalena del Mar, con buena conectividad y servicios",
"Jesús María":
"ubicado en el céntrico distrito de Jesús María, con parques, comercios y excelente accesibilidad",
Lince:
"ubicado en el distrito de Lince, muy céntrico y práctico, cerca a vías principales y servicios",
"La Molina":
"ubicado en el tranquilo distrito de La Molina, reconocido por su entorno residencial y calidad de vida",
"San Borja":
"ubicado en el ordenado distrito de San Borja, con parques y zonas residenciales muy valoradas",
"San Miguel":
"ubicado en el distrito de San Miguel, con cercanía a centros comerciales y avenidas principales",
Independencia:
"ubicado en el distrito de Independencia, con acceso a comercio, servicios y vías principales",
"Lima (Cercado)":
"ubicado en Lima Cercado, zona céntrica con gran conectividad y oferta de servicios",
};

function inicioOperacion(op: Operacion) {
if (op === "Alquiler") return "Alquilo";
if (op === "Venta") return "Vendo";
if (op === "Traspaso") return "Traspaso";
return "Ofrezco";
}

function adjetivoSegunTipo(tipo: string, _op: Operacion) {
const femenino = ["casa", "oficina"].some((w) => tipo.toLowerCase().includes(w));
const base = "hermos";
return femenino ? `${base}a` : `${base}o`;
}

function contextoDistrito(distrito: string) {
return (
DESC_DISTRITO[distrito] ||
`ubicado en el distrito de ${distrito}, con buena conectividad y servicios cercanos`
);
}

export default function App() {
// ====== MAPBOX TOKEN ======
const MAPBOX_TOKEN = "pk.eyJ1Ijoicm9sbzE3MTEiLCJhIjoiY21tYXcwc2M1MGF4NjJ6cHkyZHAzd2JhZCJ9.gddzIVjGFWDIbENMIu3MiQ";
(mapboxgl as any).accessToken = MAPBOX_TOKEN;

const [tipo, setTipo] = useState<(typeof TIPOS)[number] | "">("");
const [operacion, setOperacion] = useState<Operacion>("");
const [distrito, setDistrito] = useState<(typeof DISTRITOS)[number] | "">("");
const [direccion, setDireccion] = useState("");

const [metros, setMetros] = useState("");
const [dormitorios, setDormitorios] = useState("");
const [banos, setBanos] = useState("");
const [precio, setPrecio] = useState("");
const [extras, setExtras] = useState("");

const [resultado, setResultado] = useState("");

const [direccionValida, setDireccionValida] = useState(false);
const [coords, setCoords] = useState<[number, number] | null>(null);

const mapContainerRef = useRef<HTMLDivElement | null>(null);
const mapRef = useRef<mapboxgl.Map | null>(null);
const markerRef = useRef<mapboxgl.Marker | null>(null);
const geocoderMountRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
if (!mapContainerRef.current) return;
if (mapRef.current) return;

mapRef.current = new mapboxgl.Map({
container: mapContainerRef.current,
style: "mapbox://styles/mapbox/streets-v12",
center: [-77.0428, -12.0464],
zoom: 11,
});

markerRef.current = new mapboxgl.Marker({ color: "#111827" })
.setLngLat([-77.0428, -12.0464])
.addTo(mapRef.current);

if (geocoderMountRef.current) {
const geocoder = new MapboxGeocoder({
accessToken: MAPBOX_TOKEN,
mapboxgl,
marker: false,
placeholder: "Escribe una dirección real (Lima, Perú)",
countries: "pe",
proximity: { longitude: -77.0428, latitude: -12.0464 },
types: "address,poi",
limit: 5,
});

geocoderMountRef.current.innerHTML = "";
geocoderMountRef.current.appendChild(geocoder.onAdd(mapRef.current));

geocoder.on("result", (e: any) => {
const placeName = e?.result?.place_name || "";
const center = e?.result?.center as [number, number] | undefined;
if (!center) return;

setDireccion(placeName);
setDireccionValida(true);
setCoords(center);

markerRef.current?.setLngLat(center);
mapRef.current?.flyTo({ center, zoom: 15 });
});

geocoder.on("clear", () => {
setDireccionValida(false);
setCoords(null);
});
}
}, [MAPBOX_TOKEN]);

useEffect(() => {
setDireccionValida(false);
setCoords(null);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [direccion]);

const listoParaGenerar = useMemo(() => {
if (!tipo || !operacion || !distrito) return false;
if (direccion.trim() && !direccionValida) return false;
return true;
}, [tipo, operacion, distrito, direccion, direccionValida]);

const generar = () => {
const ini = inicioOperacion(operacion);
const adj = adjetivoSegunTipo(tipo, operacion);
const ctx = contextoDistrito(distrito);

const partes: string[] = [];
partes.push(`${ini} ${adj} ${tipo.toLowerCase()} ${ctx}.`);

if (direccionValida && direccion.trim()) {
partes.push(`Dirección / referencia: ${direccion}.`);
}

const detalles: string[] = [];
if (metros.trim()) detalles.push(`${metros} m²`);
if (dormitorios.trim()) detalles.push(`${dormitorios} dormitorios`);
if (banos.trim()) detalles.push(`${banos} baños`);
if (detalles.length) partes.push(`Cuenta con ${detalles.join(", ")}.`);

if (extras.trim()) partes.push(`Extras: ${extras}.`);
if (precio.trim()) partes.push(`Precio: ${precio}.`);

partes.push("Escríbeme para coordinar una visita o recibir más información.");

setResultado(partes.join("\n"));
};

const copiar = async () => {
if (!resultado) return;
await navigator.clipboard.writeText(resultado);
};

return (
<div style={{ minHeight: "100vh", background: "#071326", padding: 24 }}>
<div
style={{
maxWidth: 1100,
margin: "0 auto",
background: "white",
borderRadius: 18,
padding: 22,
boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
}}
>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
<div>
<div style={{ fontSize: 12, letterSpacing: 1, color: "#64748b", fontWeight: 700 }}>
IMMO TEXT • PRO
</div>
<h1 style={{ margin: "6px 0 0", fontSize: 28 }}>
Generador Profesional de Descripciones Inmobiliarias
</h1>
<p style={{ marginTop: 8, color: "#475569" }}>
Textos persuasivos listos para publicar en portales y redes sociales (Lima).
</p>
</div>

<button
onClick={copiar}
disabled={!resultado}
style={{
padding: "10px 14px",
borderRadius: 999,
border: "1px solid #e2e8f0",
background: resultado ? "#111827" : "#e5e7eb",
color: resultado ? "white" : "#6b7280",
cursor: resultado ? "pointer" : "not-allowed",
fontWeight: 700,
whiteSpace: "nowrap",
}}
title={resultado ? "Copiar resultado" : "Genera un texto primero"}
>
✓ Selects + distritos + copy
</button>
</div>

<div
style={{
display: "grid",
gridTemplateColumns: "1.05fr 0.95fr",
gap: 18,
marginTop: 16,
}}
>
{/* FORM */}
<div
style={{
border: "1px solid #eef2f7",
borderRadius: 16,
padding: 16,
background: "#ffffff",
}}
>
<div style={{ display: "grid", gap: 12 }}>
<label style={{ fontWeight: 700, fontSize: 13 }}>
Tipo de inmueble
<select
value={tipo}
onChange={(e) => setTipo(e.target.value as any)}
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
>
<option value="">Selecciona...</option>
{TIPOS.map((t) => (
<option key={t} value={t}>
{t}
</option>
))}
</select>
</label>

<label style={{ fontWeight: 700, fontSize: 13 }}>
Operación
<select
value={operacion}
onChange={(e) => setOperacion(e.target.value as Operacion)}
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
>
<option value="">Selecciona...</option>
{OPERACIONES.map((op) => (
<option key={op} value={op}>
{op}
</option>
))}
</select>
</label>

<label style={{ fontWeight: 700, fontSize: 13 }}>
Distrito
<select
value={distrito}
onChange={(e) => setDistrito(e.target.value as any)}
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
>
<option value="">Selecciona...</option>
{DISTRITOS.map((d) => (
<option key={d} value={d}>
{d}
</option>
))}
</select>
<div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
Se agrega contexto automático según el distrito seleccionado.
</div>
</label>

<div style={{ fontWeight: 700, fontSize: 13 }}>
Dirección / Zona (opcional, validación real con Mapbox)
<div style={{ marginTop: 6 }}>
<div ref={geocoderMountRef} />
</div>

{direccion.trim() && !direccionValida && (
<div style={{ marginTop: 8, fontSize: 12, color: "#b45309" }}>
⚠️ Selecciona una opción del autocompletado para validar que la dirección existe.
</div>
)}
</div>

<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
<label style={{ fontWeight: 700, fontSize: 13 }}>
Superficie (m²)
<input
value={metros}
onChange={(e) => setMetros(e.target.value)}
placeholder="Ej: 85"
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
/>
</label>
<label style={{ fontWeight: 700, fontSize: 13 }}>
Dormitorios
<input
value={dormitorios}
onChange={(e) => setDormitorios(e.target.value)}
placeholder="Ej: 3"
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
/>
</label>
<label style={{ fontWeight: 700, fontSize: 13 }}>
Baños
<input
value={banos}
onChange={(e) => setBanos(e.target.value)}
placeholder="Ej: 2"
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
/>
</label>
</div>

<label style={{ fontWeight: 700, fontSize: 13 }}>
Precio (opcional)
<input
value={precio}
onChange={(e) => setPrecio(e.target.value)}
placeholder="Ej: S/ 2,500 • $ 150,000"
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
/>
</label>

<label style={{ fontWeight: 700, fontSize: 13 }}>
Extras (opcional)
<input
value={extras}
onChange={(e) => setExtras(e.target.value)}
placeholder="Ej: cochera, terraza, ascensor, seguridad 24/7..."
style={{
marginTop: 6,
width: "100%",
padding: 12,
borderRadius: 12,
border: "1px solid #e2e8f0",
}}
/>
</label>

<button
onClick={generar}
disabled={!listoParaGenerar}
style={{
marginTop: 6,
padding: 14,
borderRadius: 14,
border: "none",
fontWeight: 800,
cursor: listoParaGenerar ? "pointer" : "not-allowed",
background: listoParaGenerar ? "#111827" : "#9ca3af",
color: "white",
}}
>
Generar descripción
</button>

<div style={{ fontSize: 12, color: "#64748b" }}>
* Para generar: selecciona <b>Tipo</b>, <b>Operación</b> y <b>Distrito</b>. Si escribes dirección, debe ser
validada con el autocompletado.
</div>
</div>
</div>

{/* RESULT + MAP */}
<div
style={{
border: "1px solid #eef2f7",
borderRadius: 16,
padding: 16,
background: "#ffffff",
display: "grid",
gridTemplateRows: "auto auto 1fr",
gap: 12,
}}
>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
<h2 style={{ margin: 0 }}>Resultado</h2>
<button
onClick={copiar}
disabled={!resultado}
style={{
padding: "8px 12px",
borderRadius: 12,
border: "1px solid #e2e8f0",
background: resultado ? "#f1f5f9" : "#f8fafc",
cursor: resultado ? "pointer" : "not-allowed",
fontWeight: 700,
color: resultado ? "#111827" : "#9ca3af",
}}
>
Copiar
</button>
</div>

<div
style={{
border: "1px dashed #cbd5e1",
borderRadius: 14,
padding: 14,
minHeight: 170,
whiteSpace: "pre-line",
color: "#0f172a",
background: "#fbfdff",
}}
>
{resultado || "Aquí aparecerá la descripción generada..."}
</div>

<div>
<div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
Mapa (se posiciona cuando validas una dirección).
</div>
<div
ref={mapContainerRef}
style={{
width: "100%",
height: 240,
borderRadius: 14,
overflow: "hidden",
border: "1px solid #e2e8f0",
}}
/>
{coords && (
<div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
Coordenadas: {coords[1].toFixed(6)}, {coords[0].toFixed(6)}
</div>
)}
</div>
</div>
</div>
</div>
</div>
);
}
