/**
 * Event callback type
 */
export type EventCallback<T> = (data: T) => void;
/**
 * Subscription handle for unsubscribing
 */

export interface Subscription {
  unsubscribe(): void;
}
