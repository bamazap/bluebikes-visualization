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
export function dataForTime(dataByID, time) {
  return Object.entries(dataByID).map(([id, timedCoords]) => {
    // assumes timedCoords is latest first
    let tll = timedCoords.find(({ time: coordTime }) => coordTime < time);
    tll = tll || timedCoords[timedCoords.length - 1]; // default to first position
    return tll && { id: parseInt(id, 10), ...tll };
  }).filter(d => !!d);
}
