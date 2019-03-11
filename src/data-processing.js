import { get } from 'lodash';
import { findInSorted } from './utils';

const MAX_DATE = new Date(253402221599);

/**
 * Get the latest-dated object with a date before the target date
 * Assumes objects are sorted by date, earliest first
 * @param {T[]} timedObjects
 * @param {Date} targetDate 
 * @return {T}
 * @template T @implements { date: Date }
 */
function findMostRecent(timedObjects, targetDate) {
  return findInSorted(timedObjects, ({ date }, i) => {
    const nextDate = get(timedObjects, [i + 1, 'date'], MAX_DATE);
    if (nextDate < targetDate) {
      return 1;
    } else if (date > targetDate) {
      return -1;
    } else {
      return 0;
    }
  });
}

/**
 * Get the latest stop after a given time for every bike in the dataset
 * Assumes the arrays in dataByID list earliest elements first
 * @param {Bikes} bikes
 * @param {Date} targetDate
 * @return {GeoCoord[]}
 */
export function bikeLocationsAtTime(bikes, targetDate) {
  return Object.values(bikes).map(({ id, stops }) => {
    let stop = findMostRecent(stops, targetDate);
    return stop && stop.station && {
      id: 'b' + id,
      latitude: stop.station.latitude,
      longitude: stop.station.longitude
    };
  }).filter(d => !!d);
}

/**
 * Get the latest stop after a given time for every bike in the dataset
 * Assumes the arrays in dataByID list earliest elements first
 * @param {Bikes} bikes
 * @param {Date} targetDate
 * @return {GeoCoord[]}
 */
export function stationBikeCountsAtTime(stations, targetDate) {
  return Object.values(stations).map((station) => {
    let bikeCount = findMostRecent(station.bikeCounts, targetDate);
    bikeCount = bikeCount || station.bikeCounts[0];
    return {
      id: 's' + station.id,
      latitude: station.latitude,
      longitude: station.longitude,
      numBikes: bikeCount.numBikes
    };
  });
}

/**
 * Get the latest stop after a given time for every bike in the dataset
 * Assumes the arrays in dataByID list earliest elements first
 * @param {Bikes} bikes
 * @param {Date} targetDate
 * @return {GeoCoord[]}
 */
export function stationFlowsInTimeInterval(stations, date1, date2) {
  return Object.values(stations).map((station) => {
    const bikeCount1 = findMostRecent(station.bikeCounts, date1) || station.bikeCounts[0];
    const bikeCount2 = findMostRecent(station.bikeCounts, date2) || station.bikeCounts[0];
    const delta = bikeCount2.numBikes - bikeCount1.numBikes;
    return {
      id: 's' + station.id,
      latitude: station.latitude,
      longitude: station.longitude,
      flow: delta
    };
  });
}
