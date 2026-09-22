"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import type { EstadoAccion } from "@/lib/panel/accion";
import {
  borrarBorrador,
  guardarBorrador,
  haceCuanto,
  leerBorrador,
  valoresDe,
} from "@/lib/panel/borrador";

type Errores = Record<string, string[] | undefined>;
type Restaurar = (valor: string) => void;

type ContextoFormulario = {
  errores: Errores;
  pendiente: boolean;
  /** Para editores que no son un campo nativo (presentaciones, fotos). */
  registrarRestaurable: (nombre: string, restaurar: Restaurar) => () => void;
  /** Las pestañas se enteran de un fallo para saltar a la que tiene el error. */
  registrarAlFallar: (alFallar: (errores: Errores) => void) => () => void;
};

const Contexto = createContext<ContextoFormulario | null>(null);

export function useFormularioPanel(): ContextoFormulario {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useFormularioPanel va dentro de <FormularioPanel>.");
  return valor;
}

type Props = {
  /** De `claveDeBorrador()`. */
  clave: string;
  accion: (datos: FormData) => Promise<EstadoAccion>;
  /** A dónde ir tras guardar bien. Sin él, se queda y refresca. */
  destino?: (id: string | undefined) => string;
  /** Para quien tiene que enseñar algo antes de irse (la contraseña temporal, T6). Sustituye a `destino`. */
  alGuardar?: (resultado: Extract<EstadoAccion, { estado: "ok" }>) => void;
  /** Validación en el navegador con el mismo esquema que la acción. */
  validar?: (datos: FormData) => Errores;
  children: ReactNode;
};

const AL_ESCRIBIR_MS = 800;

function suscribir(avisar: () => void) {
  window.addEventListener("storage", avisar);
  return () => window.removeEventListener("storage", avisar);
}

/**
 * El formulario de todas las pantallas del panel.
 *
 * Envía con onSubmit + transición, NO con `<form action>`: React 19 vacía un
 * formulario con `action` al terminar, también cuando vuelve con errores, y la
 * persona perdería lo escrito justo cuando tiene que corregirlo.
 *
 * La copia local que había al abrir se lee con useSyncExternalStore (sin
 * efecto que ponga estado) y no se sobrescribe hasta que la persona decide:
 * si se guardara al primer tecleo, se perdería la copia que se le ofrece.
 */
export function FormularioPanel({ clave, accion, destino, alGuardar, validar, children }: Props) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restaurables = useRef(new Map<string, Restaurar>());
  const alFallar = useRef(new Set<(errores: Errores) => void>());

  const [errores, setErrores] = useState<Errores>({});
  const [pendiente, iniciar] = useTransition();
  const [decidido, setDecidido] = useState(false);
  // `Date.now()` directo en el cuerpo del componente es una llamada impura
  // durante el render (`react-hooks/purity`). Se lee una sola vez al montar y
  // se reutiliza; al guardar (dentro del temporizador) sí va `Date.now()`
  // suelto, porque eso ya no ocurre durante un render.
  const [ahora] = useState(() => Date.now());

  const crudo = useSyncExternalStore(
    suscribir,
    () => localStorage.getItem(clave),
    () => null,
  );
  const borrador = crudo === null ? null : leerBorrador(localStorage, clave, ahora);
  const ofrecer = !decidido && borrador !== null;

  function alEscribir() {
    if (ofrecer) return;
    if (!decidido) setDecidido(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const form = formulario.current;
      if (!form) return;
      const valores = valoresDe(new FormData(form));
      // Una contraseña nunca va a localStorage (T6, primer ingreso).
      for (const campo of form.querySelectorAll<HTMLInputElement>("input[type=password]")) {
        delete valores[campo.name];
      }
      guardarBorrador(localStorage, clave, valores, Date.now());
    }, AL_ESCRIBIR_MS);
  }

  function recuperar() {
    const form = formulario.current;
    if (!form || !borrador) return;
    for (const casilla of form.querySelectorAll<HTMLInputElement>("input[type=checkbox]")) {
      casilla.checked = false;
    }
    for (const [nombre, valor] of Object.entries(borrador.valores)) {
      const campo = form.elements.namedItem(nombre);
      if (campo instanceof RadioNodeList) {
        campo.value = valor;
      } else if (campo instanceof HTMLInputElement && campo.type === "checkbox") {
        campo.checked = valor === "on";
      } else if (
        campo instanceof HTMLInputElement ||
        campo instanceof HTMLTextAreaElement ||
        campo instanceof HTMLSelectElement
      ) {
        campo.value = valor;
      }
      restaurables.current.get(nombre)?.(valor);
    }
    setDecidido(true);
    toast.success("Recuperaste lo que tenías escrito. Revísalo y pulsa Guardar.");
  }

  function descartar() {
    borrarBorrador(localStorage, clave);
    setDecidido(true);
  }

  function fallar(nuevos: Errores) {
    setErrores(nuevos);
    for (const avisar of alFallar.current) avisar(nuevos);
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // El segundo argumento añade el botón pulsado (`name="intencion"`): sin él,
    // novedades no sabría si se pulsó «Guardar» o «Enviar a revisión».
    const datos = new FormData(evento.currentTarget, (evento.nativeEvent as SubmitEvent).submitter);

    const locales = validar?.(datos) ?? {};
    if (Object.values(locales).some((e) => e && e.length > 0)) {
      fallar(locales);
      toast.error("Revisa los campos marcados en rojo.");
      return;
    }

    iniciar(async () => {
      const resultado = await accion(datos);
      if (resultado.estado === "error") {
        fallar(resultado.errores ?? {});
        toast.error(resultado.mensaje);
        return;
      }
      if (resultado.estado === "ok") {
        setErrores({});
        borrarBorrador(localStorage, clave);
        toast.success(resultado.mensaje);
        if (alGuardar) alGuardar(resultado);
        else if (destino) router.push(destino(resultado.id));
        else router.refresh();
      }
    });
  }

  const contexto: ContextoFormulario = {
    errores,
    pendiente,
    registrarRestaurable: (nombre, restaurar) => {
      restaurables.current.set(nombre, restaurar);
      return () => restaurables.current.delete(nombre);
    },
    registrarAlFallar: (avisar) => {
      alFallar.current.add(avisar);
      return () => alFallar.current.delete(avisar);
    },
  };

  return (
    <Contexto value={contexto}>
      {ofrecer && borrador ? (
        // La franja durazno (tinta encima da 10.39; el marrón de
        // `bg-cta-secundario` es texto crema sobre dorado-800 y con tinta
        // heredada solo da 2.65, y `.boton-linea` con el azul institucional
        // baja a 1.94 — ver src/estilos/paleta.test.ts). Este aviso reutiliza
        // el par ya probado de la franja de confianza.
        <div
          role="status"
          className="bg-franja text-franja-foreground mb-4 rounded-xl p-4 text-sm"
          data-borrador
        >
          <p className="font-semibold">
            Tienes cambios sin guardar de {haceCuanto(borrador.guardadoEn, ahora)}
          </p>
          <p>Se guardaron en este aparato mientras escribías.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="boton-cta" onClick={recuperar}>
              Recuperarlos
            </button>
            <button type="button" className="boton-linea" onClick={descartar}>
              Descartar
            </button>
          </div>
        </div>
      ) : null}
      <form
        ref={formulario}
        onSubmit={enviar}
        onInput={alEscribir}
        onChange={alEscribir}
        noValidate
        className="flex flex-col gap-4"
      >
        {children}
      </form>
    </Contexto>
  );
}
