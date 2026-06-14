"use client";

import * as React from "react";

interface ValoresContextValue {
  oculto: boolean;
  toggle: () => void;
}

const ValoresContext = React.createContext<ValoresContextValue | null>(null);

const STORAGE_KEY = "painel-ro-valores-ocultos";

export function ValoresProvider({ children }: { children: React.ReactNode }) {
  const [oculto, setOculto] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "1") setOculto(true);
  }, []);

  const toggle = React.useCallback(() => {
    setOculto((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ oculto, toggle }), [oculto, toggle]);
  return (
    <ValoresContext.Provider value={value}>{children}</ValoresContext.Provider>
  );
}

export function useValores() {
  const ctx = React.useContext(ValoresContext);
  if (!ctx) return { oculto: false, toggle: () => {} };
  return ctx;
}

/** Mascara um valor monetário já formatado quando o modo oculto está ligado. */
export function Valor({ children }: { children: React.ReactNode }) {
  const { oculto } = useValores();
  if (oculto) {
    return (
      <span className="select-none tracking-wider text-muted-foreground">
        R$ ••••••
      </span>
    );
  }
  return <>{children}</>;
}

/** Botão olho para alternar a visibilidade dos valores. */
export function ToggleValores({ className }: { className?: string }) {
  const { oculto, toggle } = useValores();
  return (
    <button
      type="button"
      onClick={toggle}
      className={className}
      aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
      title={oculto ? "Mostrar valores" : "Ocultar valores"}
    >
      {oculto ? <EyeOff /> : <Eye />}
    </button>
  );
}

function Eye() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
