'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { UIProperties } from '@/lib/types';
import { DEFAULT_UI_PROPERTIES } from '@/lib/ui-defaults';


interface UIPropertiesContextValue {
  properties: UIProperties;
  departments: string[];
  nav: (key: keyof UIProperties['navigation'], fallback?: string) => string;
  label: (key: keyof UIProperties['labels'], fallback?: string) => string;
  customProp: (key: string, fallback?: string) => string;
}

const UIPropertiesContext = createContext<UIPropertiesContextValue>({
  properties: DEFAULT_UI_PROPERTIES,
  departments: DEFAULT_UI_PROPERTIES.departments,
  nav: (key, fallback) => DEFAULT_UI_PROPERTIES.navigation[key] || fallback || '',
  label: (key, fallback) => DEFAULT_UI_PROPERTIES.labels[key] || fallback || '',
  customProp: (key, fallback) =>
    DEFAULT_UI_PROPERTIES.custom_properties.find((p) => p.key === key)?.value || fallback || '',
});

export function UIPropertiesProvider({
  initialProperties,
  children,
}: {
  initialProperties?: UIProperties;
  children: ReactNode;
}) {
  const properties = initialProperties || DEFAULT_UI_PROPERTIES;

  const nav = (key: keyof UIProperties['navigation'], fallback?: string): string => {
    return properties.navigation[key] || DEFAULT_UI_PROPERTIES.navigation[key] || fallback || '';
  };

  const label = (key: keyof UIProperties['labels'], fallback?: string): string => {
    return properties.labels[key] || DEFAULT_UI_PROPERTIES.labels[key] || fallback || '';
  };

  const customProp = (key: string, fallback?: string): string => {
    const found = properties.custom_properties?.find((p) => p.key === key);
    return found?.value || fallback || '';
  };

  return (
    <UIPropertiesContext.Provider
      value={{
        properties,
        departments: properties.departments || DEFAULT_UI_PROPERTIES.departments,
        nav,
        label,
        customProp,
      }}
    >
      {children}
    </UIPropertiesContext.Provider>
  );
}

export function useUIProperties() {
  return useContext(UIPropertiesContext);
}
