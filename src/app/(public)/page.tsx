// Portada provisional. La portada real llega en la Fase 3, con el sistema de
// diseno ya definido (doc 03 §4.2). Esto existe para que el scaffold arranque,
// el CI tenga algo que servir y Playwright algo que abrir.
export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold">Panadería Pimpo&apos;s</h1>
      <p className="text-lg">Elaborado y vendido el mismo día. Delivery propio a toda Iquitos.</p>
      <p className="text-sm opacity-70">Sitio en construcción.</p>
    </main>
  );
}
