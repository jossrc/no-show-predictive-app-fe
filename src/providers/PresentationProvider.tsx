'use client';

import { createContext, type ReactNode, useContext } from 'react';

export interface PresentationState {
  diagnosticsEnabled: boolean;
}

/** Valor seguro por defecto: sin diagnósticos si el proveedor no está presente. */
const PresentationContext = createContext<PresentationState>({ diagnosticsEnabled: false });

/**
 * Distribuye a los componentes cliente la decisión ya resuelta en el servidor por
 * `getPresentationConfig()`. No lee variables de entorno ni guarda otro estado.
 */
export function PresentationProvider({
  value,
  children,
}: {
  value: PresentationState;
  children: ReactNode;
}) {
  return <PresentationContext.Provider value={value}>{children}</PresentationContext.Provider>;
}

export function usePresentation(): PresentationState {
  return useContext(PresentationContext);
}
