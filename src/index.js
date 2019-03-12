
import './styles.css';
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import * as d3 from 'd3';
import { last } from 'lodash';
import { drawFlowStations } from './draw';
import { stationsInTimeInterval } from './data-processing';
import { setTimeoutPromise } from './utils';

function getIndex(bbData, date, roundUp=true) {
  let floatIndex = (date.getTime() - bbData.firstTime) / bbData.timestepMsec;
  let index = Math.floor(floatIndex);
  if (!roundUp && floatIndex === index) {
    index -= 1;
  }
  return index;
}

function makeTimeIntervalIterator(date1, date2) {
  return (bbData, callback) => {
    const i1 = Math.max(getIndex(bbData, date1), 0);
    const i2 = getIndex(bbData, date2, false);
    for (let i = i1; i <= i2; i += 1) {
      if (bbData.data[i]) {
        callback(bbData.data[i]);
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
  const minDate = new Date('2019-02-01 00:00:00');
  const maxDate = new Date('2019-02-01 12:00:01');
  const timeStepMsec = 60 * 60 * 1000;
  const delayMsec = 1000; // time between display changes

  const bbData = await d3.json('data/data-hourly.json');

  // aggregate calculations needed by the draw functions
  let minFlow = 0;
  let maxFlow = 0;
  let flowData = [];
  const dates = dateRange(minDate, maxDate, timeStepMsec);
  dates.forEach((date, i) => {
    if (i === dates.length - 1) return;
    const iterator = makeTimeIntervalIterator(date, dates[i+1]);
    const stationPoints = stationsInTimeInterval(bbData, iterator);
    flowData.push(stationPoints);
    for (let station of stationPoints) {
      minFlow = Math.min(minFlow, station.numBikesDelta);
      maxFlow = Math.max(maxFlow, station.numBikesDelta);
    }
  });

  // method to update the view for the i'th timestep
  const draw = (i) => {
    const date = dates[i];
    timestamp.text(date.toDateString() + ' ' + date.toLocaleTimeString());
    const stationPoints = flowData[i];
    drawFlowStations(stationPoints, minFlow, maxFlow);
  }

  // draw the timesteps over time
  for (let i in flowData) {
    await Promise.all([
      setTimeoutPromise(delayMsec),
      draw(i),
    ]);
  }
}

main();
