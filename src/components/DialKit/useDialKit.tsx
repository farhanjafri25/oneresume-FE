'use client';

import React, { useState } from 'react';
import styles from './DialKit.module.css';

type NumberControl = { type: 'number'; value: number; min: number; max: number; step?: number };
type ToggleControl = { type: 'toggle'; value: boolean };
type SelectControl = { type: 'select'; value: string; options: string[] };
type ColorControl = { type: 'color'; value: string };
type Control = NumberControl | ToggleControl | SelectControl | ColorControl;

export type DialSchema = Record<string, Control>;

type ValueOf<C> = C extends NumberControl
  ? number
  : C extends ToggleControl
    ? boolean
    : C extends SelectControl
      ? string
      : C extends ColorControl
        ? string
        : never;

type Values<S extends DialSchema> = { [K in keyof S]: ValueOf<S[K]> };

/** Live control panel. Returns current values and a `panel` node to render. */
export function useDialKit<S extends DialSchema>(
  title: string,
  schema: S,
): { values: Values<S>; panel: React.ReactNode } {
  const [values, setValues] = useState<Values<S>>(() => {
    const initial = {} as Values<S>;
    (Object.keys(schema) as (keyof S)[]).forEach((key) => {
      initial[key] = schema[key].value as Values<S>[keyof S];
    });
    return initial;
  });

  const set = <K extends keyof S>(key: K, value: Values<S>[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const panel = (
    <aside className={styles.panel} aria-label={`${title} controls`}>
      <h2 className={styles.title}>{title}</h2>
      {(Object.keys(schema) as (keyof S & string)[]).map((key) => {
        const control = schema[key];
        return (
          <label key={key} className={styles.row}>
            <span className={styles.label}>{key}</span>
            {control.type === 'number' && (
              <span className={styles.numberControl}>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step ?? 0.01}
                  value={values[key] as number}
                  onChange={(e) => set(key, Number(e.target.value) as Values<S>[typeof key])}
                />
                <output className={styles.value}>{(values[key] as number).toFixed(2)}</output>
              </span>
            )}
            {control.type === 'toggle' && (
              <input
                type="checkbox"
                checked={values[key] as boolean}
                onChange={(e) => set(key, e.target.checked as Values<S>[typeof key])}
              />
            )}
            {control.type === 'select' && (
              <select
                value={values[key] as string}
                onChange={(e) => set(key, e.target.value as Values<S>[typeof key])}
              >
                {control.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
            {control.type === 'color' && (
              <input
                type="color"
                value={values[key] as string}
                onChange={(e) => set(key, e.target.value as Values<S>[typeof key])}
              />
            )}
          </label>
        );
      })}
    </aside>
  );

  return { values, panel };
}
