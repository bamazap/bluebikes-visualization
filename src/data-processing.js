import { get } from 'lodash';
import { indexofInSorted } from './utils';

const MAX_DATE = new Date(253402221599);

/**
 * Get the latest-dated object with a date before the target date
 * Assumes objects are sorted by date, earliest first
 * @param {{ date: Date }[]} timedObjects
 * @param {Date} targetDate
 */
function indexofMostRecent(timedObjects, targetDate) {
  return indexofInSorted(timedObjects, ({ date }, i) => {
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
 * @see indexofMostRecent
 * Returns the actual element instead of the index
 */
function findMostRecent(timedObjects, targetDate) {
  const index = indexofMostRecent(timedObjects, targetDate);
  return index < 0 ? undefined : timedObjects[index];
}

/**
 * Get the latest stop after a given time for every bike in the dataset
 * Assumes the arrays in dataByID list earliest elements first
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
 * Get data for every station during a time interval
 */
export function stationsInTimeInterval(stations, date1, date2) {
  return Object.values(stations).map((station) => {
    const bikeCount1 = findMostRecent(station.bikeCounts, date1) || station.bikeCounts[0];
    const bikeCount2 = findMostRecent(station.bikeCounts, date2) || station.bikeCounts[0];
    const numBikes = (bikeCount1.numBikes + bikeCount2.numBikes) / 2;
    const fullness = numBikes / station.maxNumBikes;
    const numBikesDelta = bikeCount2.numBikes - bikeCount1.numBikes;

    const targets = {};
    const sources = {};
    const i1 = Math.max(indexofMostRecent(station.bikeCountDeltas, date1), 0);
    const i2 = indexofMostRecent(station.bikeCountDeltas, date2);
    for (let i = i1; i <= i2; i += 1) {
      const { otherStation, numBikesDelta: d } = station.bikeCountDeltas[i];
      if (otherStation) {
        const stationID = otherStation.id;
        const obj = d > 0 ? sources : targets;
        obj[stationID] = (obj[stationID] || 0) + 1;
      }
    }

    return {
      id: 's' + station.id,
      latitude: station.latitude,
      longitude: station.longitude,
      numBikes,
      fullness,
      numBikesDelta,
      targets: countObjToSortedEntries(targets, stations),
      sources: countObjToSortedEntries(sources, stations)
    };
  });
}

function countObjToSortedEntries(countObj, stations) {
  return Object.entries(countObj)
    .map(([id, count]) => ({ station: stations[id], count }))
    .sort((a, b) => b.count - a.count); // descending
}
