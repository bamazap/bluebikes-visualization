import uuidv4 from 'uuid/v4';

const idxKey = uuidv4(); // used by findInSorted
/**
 * Locate an element in a sorted array
 * Performs better than find when most subsequent calls want nearby elements
 * @param {T[]} array
 * @param {(e: T, i: number, a: T[]) => number} matchFn
 *    e is an element in the array
 *    i is the index that e is found at
 *    a is the array
 *    the number returned n says where to look for the desired element e_d
 *    n > 0 means e is smaller than e_d
 *    n < 0 means e is larger than e_d
 *    n = 0 means e is e_d
 * @return {T} the matching element or undefined if not found
 */
export function findInSorted(array, matchFn) {
  // set initial value for search index
  if (array[idxKey] === undefined) {
    // this method makes it non-enumerable
    Object.defineProperty(array, idxKey, {
      value: Math.floor(array.length / 2),
      writable: true
    });
  }

  let direction = 0; // -1 or 1 (to tail or head), set after first comparison
  // 0 means unset because we want to not move before first check
  let match = 0; // return of matchFn for current element
  // 0 is purely to make the first while check pass
  while (
    direction === match // only move one direction per search
    && (array[idxKey] + direction >= 0) // stay in bounds
    && (array[idxKey] + direction <= array.length - 1) // stay in bounds
  ) {
    array[idxKey] += direction;
    match = Math.sign(matchFn(array[array[idxKey]], array[idxKey], array));
    if (match === 0) {
      return array[array[idxKey]];
    }
    // set direction after first check
    if (direction === 0) {
      direction = match;
    }
  }
}

/**
 * Returns a promise that resolves after t milliseconds
 * @param {number} t 
 */
export function setTimeoutPromise(t) {
  return new Promise(resolve => setTimeout(resolve, t));
}
