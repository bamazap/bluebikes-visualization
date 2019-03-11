import { json as getJSON, csv as getCSV } from 'd3';
import { last } from 'lodash';

/**
 * Get the background map for the visualization
 * @return {*} GeoJSON
 */
export async function getMapData() {
  return getJSON('data/bostonmetro.geojson');
}

/**
 * Get the Blue Bike data
 * TODO: more than one day of data, need to break up CSV files
 * @param {boolean} addTeleports
 * @return {Promise<{ stations: Stations, bikes: Bikes}>}
 */
export async function getBlueBikesData(addTeleports=false) {
  const bikes = {};
  const stations = {};
  /**
   * @param {Station | null} station
   * @param {Date} date
   * @param {-1 | 1} delta
   */
  const addSizeChange = (station, date, numBikesDelta) => {
    if (station !== null) {
      station.bikeCountDeltas.push({
        numBikesDelta,
        date
      });
    }
  };
  /**
   * @param {Bike} bike 
   * @param {BikeStop} stop 
   */
  const addStop = (bike, stop) => {
    const lastStop = last(bike.stops);
    // log size changes
    if (lastStop) addSizeChange(lastStop.station, stop.date, -1);
    addSizeChange(stop.station, stop.date, 1);
    // log bike stop
    bike.stops.push(stop);
  }

  const rawData = await getCSV('/data/20190201-bluebikes-tripdata.csv');
  rawData.forEach((datum) => {
    const bikeID = parseInt(datum.bikeid, 10);
    if (!(bikeID in bikes)) {
      bikes[bikeID] = {
        id: bikeID,
        stops: []
      };
    }
    const bike = bikes[bikeID];

    ['start', 'end'].forEach((point) => {
      const stationID = parseFloat(datum[`${point} station id`]);
      if (!(stationID in stations)) {
        const latitude = parseFloat(datum[`${point} station latitude`]);
        const longitude = parseFloat(datum[`${point} station longitude`]);
        stations[stationID] = {
          id: stationID,
          latitude,
          longitude,
          bikeCountDeltas: [],
        };
      }
      const station = stations[stationID];

      const date = new Date(datum[`${point === 'end' ? 'stop' : 'start'}time`]);
      const lastStop = last(bike.stops);

      if (!lastStop) {
        // the bike is at the station at the beginning of the visualization
        addStop(bike, { date: new Date(0), station });
      } else if (point === 'end') {
        // the bike moves to the station
        addStop(bike, { date, station });
      } else if (addTeleports && point === 'start' && lastStop.station !== station) {
        // bike starts from station it did not just end at = relocated
        // add events to account for this
        const lastTime = lastStop.date.getTime();
        const timeDiff = date.getTime() - lastTime;
        const firstThird = new Date(Math.round(lastTime + timeDiff / 3));
        const secondThird = new Date(Math.round(lastTime + 2 * timeDiff / 3));
        addStop(bike, { date: firstThird, station: null });
        addStop(bike, { date: secondThird, station });
      }
    });
  });
  
  Object.values(stations).forEach((station) => {
    let numBikes = 0;
    let minNumBikes = 0;
    let bikeCounts = [];
    // order deltas by time (by station they may not be ordered)
    station.bikeCountDeltas.sort((a, b) => a.date.getTime() - b.date.getTime());
    // merge deltas for the same time
    let lastDelta;
    station.bikeCountDeltas.forEach((delta, i) => {
      if (lastDelta && lastDelta.date.getTime() === delta.date.getTime()) {
        lastDelta.numBikesDelta += delta.numBikesDelta;
        station.bikeCountDeltas[i] = null;
      } else {
        lastDelta = delta;
      }
    });
    station.bikeCountDeltas = station.bikeCountDeltas.filter(bcd => !!bcd);
    // build bike counts at times from deltas
    station.bikeCountDeltas.forEach(({ numBikesDelta, date }) => {
      numBikes += numBikesDelta;
      minNumBikes = Math.min(numBikes, minNumBikes);
      bikeCounts.push({
        numBikes,
        date
      });
    });
    // if you aren't adding teleports, bike counts may go negative
    // if this happens, shift all values up
    if (minNumBikes < 0) {
      if (addTeleports) {
        throw new Error('Teleport events added but a bike got lost somehow!');
      }
      station.bikeCounts.forEach(bikeCount => {
        bikeCount.numBikes += -1 * minNumBikes;
      });
    }
    station.bikeCounts = bikeCounts;
  });
  return { bikes, stations };
}
