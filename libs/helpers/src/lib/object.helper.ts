import { SafeAny } from '@dev-console/types';
import { ConditionalPick } from 'type-fest';

export function mapBy<T extends Record<string, SafeAny>, K extends keyof T>(values: T[], key: K): Record<T[K], T> {
  const result: Record<T[K], T> = {} as SafeAny;
  for (const entry of values) {
    if (typeof entry[key] === 'string') {
      result[entry[key]] = entry;
    }
  }
  return result;
}

/**
 * Creates a dictionary from another dictionary of objects by a given iteratee
 * @param dict a dictionary of objects
 * @param iteratee property of the object or function to retrieve a value
 */
export function mapObjectValues<T, S>(dict: Record<string, T>, iteratee: (value: T, key: string) => S): Record<string, S>;
export function mapObjectValues<T, S extends keyof ConditionalPick<T, string | number>>(dict: Record<string, T>, iteratee: S): Record<string, T[S]>;
export function mapObjectValues(
  dict: Record<string, SafeAny>,
  iteratee: ((value: SafeAny, key: string) => SafeAny) | string,
): Record<string, SafeAny> {
  return Object.keys(dict).reduce(
    (previousValue, currentValue) => {
      previousValue[currentValue] = typeof iteratee === 'string'
        ? dict[currentValue][iteratee]
        : iteratee(dict[currentValue], currentValue);
      return previousValue;
    },
    {} as Record<string, SafeAny>, // Initialize an empty object with the appropriate type
  );
}
