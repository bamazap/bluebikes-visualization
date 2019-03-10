import { json as getJSON, csv as getCSV } from 'd3';
import { get, last } from 'lodash';

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
 * @return {Promise<{ stations: Stations, bikes: Bikes}>}
 */
export async function getBlueBikesData() {
  const bikes = {};
  const stations = {};
  /**
   * @param {Station | null} station
   * @param {Date} date
   * @param {-1 | 1} delta
   */
  const addSizeChange = (station, date, delta) => {
    if (station !== null) {
      const lastCount = last(station.bikeCounts);
      if (!lastCount || date) {
        station.bikeCounts.push({
          numBikes: get(lastCount, 'numBikes', 0) + delta,
          date
        });
      } else { // date = 0 means add to initial count
        lastCount.numBikes += delta;
      }
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
          bikeCounts: [],
        };
      }
      const station = stations[stationID];

      const date = new Date(datum[`${point === 'end' ? 'stop' : 'start'}time`]);
      const lastStop = last(bike.stops);

      if (!lastStop) {
        // the bike is at the station at the beginning of the visualization
        addStop(bike, { date: 0, station });
      } else if (point === 'end') {
        // the bike moves to the station
        addStop(bike, { date, station });
      } else if (point === 'start' && lastStop.station !== station) {
        // bike starts from station it did not just end at = relocated
        // add events to account for this
        const thirdTime = (lastStop.date.getTime() + date.getTime()) / 3;
        const firstThird = new Date(Math.round(thirdTime));
        const secondThird = new Date(Math.round(2 * thirdTime));
        addStop(bike, { date: firstThird, station: null });
        addStop(bike, { date: secondThird, station });
      }
    });
  });
  return { bikes, stations };
}
