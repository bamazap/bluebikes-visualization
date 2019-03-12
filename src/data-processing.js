/**
 * Get data for every station
 * bbData is the object returned from getBlueBikesData
 * the iterator is a function that takes bbdata and a callback
 *   and calls the callback on elements of bbdata.data
 *   e.g. within a time range, only for mondays, etc.
 *   and returns a promise that resolves once it is done
 */
export async function stationsInTimeInterval(bbData, iterator) {
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
    };
  });
  // sum up the moves for the desired hours
  await iterator(bbData, (timestepData) => {
    Object.entries(timestepData).forEach(([sID, targets]) => {
      Object.entries(targets).forEach(([tID, delta]) => {
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

function countObjToSortedEntries(countObj, stations) {
  return Object.entries(countObj)
    .map(([id, count]) => ({ station: stations[id], count }))
    .sort((a, b) => b.count - a.count); // descending
}
