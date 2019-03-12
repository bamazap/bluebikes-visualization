/**
 * Returns a promise that resolves after t milliseconds
 * @param {number} t 
 */
export function setTimeoutPromise(t) {
  return new Promise(resolve => setTimeout(resolve, t));
}
