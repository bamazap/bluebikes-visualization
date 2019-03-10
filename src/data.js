import * as d3 from 'd3';

/**
 * @typedef Stop
 * @prop {Date} time
 * @prop {number} latitude
 * @prop {number} longitude
 */

/**
 * @typedef {Object.<number, Stop>} DataByID
 */

/**
 * @typedef { { id: number } & Stop } IDStop
 */


/**
 * Get the background map for the visualization
 * @return {*} GeoJSON
 */
export async function getMapData() {
  return d3.json('data/bostonmetro.geojson');
}

/**
 * Get the Blue Bike data
 * TODO: more than one day of data, need to break up CSV files
 * @return {Promise<DataByID>}
 */
export async function getBikeData() {
  const dataByID = {};
  const rawData = await d3.csv('/data/20190201-bluebikes-tripdata.csv');
  rawData.forEach((datum) => {
    const bikeID = parseInt(datum.bikeid, 10);
    const stops = dataByID[bikeID] || [];
    dataByID[bikeID] = stops;
    ['start', 'end'].forEach((point) => {
      const latitude = parseFloat(datum[`${point} station latitude`]);
      const longitude = parseFloat(datum[`${point} station longitude`]);
      const time = new Date(datum[`${point === 'end' ? 'stop' : 'start'}time`]);
      const lastStop = stops[stops.length - 1];
      // throw out dock events which are for the same location as previous
      // we are assuming the data is already sorted by time (seems to be)
      // we are not assuming bikes do not teleport (need to check this)
      if (
        !lastStop
        || lastStop.latitude !== latitude
        || lastStop.longitude !== longitude
      ) {
        stops.push({ time, latitude, longitude });
      }
    });
  });
  // reverse the lists (makes things easier below)
  Object.values(dataByID).forEach(a => a.reverse());
  return dataByID;
}

/**
 * Get the latest stop after a given time for every bike in the dataset
 * Assumes the arrays in dataByID list latest elements first
 * @prop {DataByID} dataByID
 * @prop {Date} time
 * @return {IDStop[]}
 */
export function bikeLocationsAtTime(dataByID, time) {
  return Object.entries(dataByID).map(([id, timedCoords]) => {
    // assumes timedCoords is latest first
    let tll = timedCoords.find(({ time: coordTime }) => coordTime < time);
    tll = tll || timedCoords[timedCoords.length - 1]; // default to first position
    return tll && { id: parseInt(id, 10), ...tll };
  }).filter(d => !!d);
}

/**
 * @typedef {Object.<string, Station>} Stations
 */

/**
 * @typedef Station
 * @prop {number} latitude
 * @prop {number} longitude
 * @prop {Delta[]} deltas
 */

/**
 * @typedef Delta
 * @prop {number} delta
 * @prop {Date} time
 */

/**
 * @return {Promise<Stations>}
 */
export async function getStationData() {
  const data = await d3.json('/data/station-size-deltas.json');
  for (let datum of Object.values(data)) {
    for (let delta of datum.deltas) {
      delta.time = new Date(delta.time);
    }
  }
  console.log(Math.max(...Object.values(data).map(d => d.maxNumBikes)));
  debugger;
  return data;
}

/**
 * @typedef TimeStation
 * @prop {string} id
 * @prop {number} latitude
 * @prop {number} longitude
 * @prop {number} size
 */

/**
 * @param {Station} station
 * @param {Date} time 
 */
function stationBikeCountAtTime(station, time) {
  if (!('size' in station)) {
    station.numBikes = station.startNumBikes
  }
  station.numBikes = station.deltas
    .filter(({ time: t }) => t < time)
    .reduce((numBikes, { delta }) => numBikes + delta, station.numBikes);
  station.deltas = station.deltas
    .filter(({ time: t }) => t >= time)
}

export function bikeCountsAtTime(stations, time) {
  return Object.entries(stations).map(([id, station]) => {
    stationBikeCountAtTime(station, time);
    return {
      id,
      latitude: station.latitude,
      longitude: station.longitude,
      size: station.numBikes / station.maxNumBikes
    };
  });
}

const setTimeoutPromise = t => new Promise(resolve => setTimeout(resolve, t));

export async function bikeCountsOverTime(
  stations,
  minTime,
  maxTime,
  timeStepMsec,
  callback,
  delay
) {
  for (let t = minTime; t < maxTime; t = new Date(t.getTime() + timeStepMsec)) {
    callback(bikeCountsAtTime(stations, t));
    await setTimeoutPromise(delay);
  }
}
