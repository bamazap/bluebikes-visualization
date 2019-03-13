import * as L from 'leaflet';

/**
 * Get data for every station
 * bbData is the object returned from getBlueBikesData
 * the iterator is a function that takes bbdata and a callback
 *   and calls the callback on elements of bbdata.data
 *   e.g. within a time range, only for mondays, etc.
 *   and returns a promise that resolves once it is done
 */
export async function stationsInTimeIntervalAndRegion(bbData, iterator, region, regionSelectMode) {
  // an object for every station to use in the draw functions
  const stations = {};
  Object.entries(bbData.stations).forEach(([id, { latitude, longitude }]) => {
    stations[id] = {
      id: 's' + id,
      latitude,
      longitude,
      numBikesIn: 0,
      numBikesOut: 0,
      targets: {},
      sources: {},
      inRegion: region ? region.contains(new L.LatLng(latitude, longitude)) : true
    };
  });
  // sum up the moves for the desired hours
  // ONLY consider trips that END in the desired region
  await iterator(bbData, (timestepData) => {
    Object.entries(timestepData).forEach(([sID, targets]) => {
        if ((regionSelectMode == "both" || regionSelectMode == "outgoing") && !stations[sID].inRegion) {
          return;
        }
      Object.entries(targets).forEach(([tID, delta]) => {
        if ((regionSelectMode == "both" || regionSelectMode == "incoming") && !stations[tID].inRegion) {
          return;
        }
        stations[sID].numBikesOut += delta;
        stations[sID].targets[tID] = (stations[sID].targets[tID] || 0) + delta;
        stations[tID].numBikesIn += delta;
        stations[tID].sources[sID] = (stations[tID].sources[sID] || 0) + delta;
      });
    });
  });
  // dependent state -- nicer to work with in draw functions
  Object.values(stations).forEach(s => {
    s.numBikesDelta = s.numBikesIn - s.numBikesOut;
    s.rankedTargets = countObjToSortedEntries(s.targets, bbData.stations);
    s.rankedSources = countObjToSortedEntries(s.sources, bbData.stations);
  });
  return Object.values(stations);
}

// /** 
//  * Filter data to only stations in a certain region
//  */
// export function stationsInRegion(stationData, region) {
//   if (!region) {
//     return stationData;
//   }
//   return stationData.filter((station) => {
//     const stationLoc = new L.LatLng(station.latitude, station.longitude)

//     return region.contains(stationLoc);
//   });
// }

function countObjToSortedEntries(countObj, stations) {
  return Object.entries(countObj)
    .map(([id, count]) => ({ station: stations[id], count }))
    .sort((a, b) => b.count - a.count); // descending
}
