/**
 * Returns a promise that resolves after t milliseconds
 * @param {number} t 
 */
export function setTimeoutPromise(t) {
  return new Promise(resolve => setTimeout(resolve, t));
}

/**
 * Return an array of evenly spaced dates
 * beginning with date1 and where all dates are < date 2
 * @param {Date} date1 should be < date2, inclusive bound
 * @param {Date} date2 should be > date1, exclusive bound
 * @param {number} stepMsec
 */
export function dateRange(date1, date2, stepMsec) {
  const dates = [];
  for (let d = date1; d < date2; d = new Date(d.getTime() + stepMsec)) {
    dates.push(d);
  }
  return dates;
}
