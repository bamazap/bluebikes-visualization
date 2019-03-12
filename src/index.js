
import './styles.css';
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import * as d3 from 'd3';
import { drawFlowStations } from './draw';
import { stationsInTimeInterval } from './data-processing';
import { setTimeoutPromise } from './utils';
import getBlueBikesData from './data-loading';

function getIndex(bbData, date, roundUp=true) {
  let floatIndex = (date.getTime() - bbData.firstTime) / bbData.timestepMsec;
  let index = Math.floor(floatIndex);
  if (!roundUp && floatIndex === index) {
    index -= 1;
  }
  return index;
}

function makeTimeIntervalIterator(date1, date2) {
  return async (bbData, callback) => {
    const i1 = Math.max(getIndex(bbData, date1), 0);
    const i2 = getIndex(bbData, date2, false);
    for (let i = i1; i <= i2; i += 1) {
      const datum = await bbData.getData(i);
      if (datum) {
        callback(datum);
      }
    }
  }
}

function dateRange(date1, date2, stepMsec) {
  const dates = [];
  for (let d = date1; d < date2; d = new Date(d.getTime() + stepMsec)) {
    dates.push(d);
  }
  return dates;
}

async function main() {
  const timestamp = d3.select('#timestamp')

  // parameters
  const minDate = new Date(Date.UTC(2018, 6, 30));
  const maxDate = new Date(Date.UTC(2018, 7, 5));
  const timeStepMsec = 60 * 60 * 1000;
  const delayMsec = 500; // time between display changes

  const bbData = await getBlueBikesData();

  // aggregate calculations needed by the draw functions
  let minFlow = 0;
  let maxFlow = 0;
  let flowData = [];
  const dates = dateRange(minDate, maxDate, timeStepMsec);
  for (let i = 0; i < dates.length - 1; i += 1) {
    const iterator = makeTimeIntervalIterator(dates[i], dates[i+1]);
    const stationPoints = await stationsInTimeInterval(bbData, iterator);
    flowData.push(stationPoints);
    for (let station of stationPoints) {
      minFlow = Math.min(minFlow, station.numBikesDelta);
      maxFlow = Math.max(maxFlow, station.numBikesDelta);
    }
  }

  // method to update the view for the i'th timestep
  const draw = (i) => {
    const date = dates[i];
    timestamp.text(date.toUTCString().slice(0, -4));
    const stationPoints = flowData[i];
    drawFlowStations(stationPoints, minFlow, maxFlow);
  }

  // draw the timesteps over time
  for (let i = 0; i < flowData.length; i += 1) {
    await Promise.all([
      setTimeoutPromise(delayMsec),
      draw(i),
    ]);
  }
}

main();
