import { get } from 'lodash';
import { indexofInSorted, sumObjects } from './utils';

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

function getIndex(bbData, date) {
  return Math.floor((date.getTime() - bbData.firstDate) / bbData.timestepMsec);
}

/**
 * Get data for every station during a time interval
 */
export function stationsInTimeInterval(bbData, iterator) {
  return Object.entries(bbData.stations).map(([id, { latitude, longitude }]) => {
    let 
    let numBikesIn = Object.keys(bbData.stations).reduce((sum, sourceID) => {
      let numBikesFromSource = 0;
      iterator(bbData, sources => {
        numBikesFromSource += get(sources, [sourceID, id], 0);
      });
      return sum + numBikesFromSource;
    });
    let numBikesOut = 0;
    iterator(bbData, sources => {
      numBikesOut += Object.values(get(sources, id, {})).reduce((s, v) => s + v, 0);
    });

    const targets = {};
    const sources = {};
    const i1 = getIndex(bbData, date1);
    const i2 = getIndex(bbData, date2);
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
