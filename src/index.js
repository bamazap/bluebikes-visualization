
import * as d3 from 'd3';
import { last } from 'lodash';
import { getMapData, getBlueBikesData } from './data-loading';
import { drawMap, drawBikes, drawNumBikesStations, drawFlowStations } from './draw';
import { bikeLocationsAtTime, stationBikeCountsAtTime, stationFlowsInTimeInterval } from './data-processing';
import { setTimeoutPromise } from './utils';

async function showSize(load) {
  const {
    timestamp, bikeLayer, stationLayer, delayMsec,
    minDate, maxDate, timeStepMsec, projection, bbData
  } = load;

  const maxNumBikes = Math.max(...Object.values(bbData.stations)
    .map(({ bikeCounts }) => Math.max(...bikeCounts.map(bc => bc.numBikes))));

  const draw = (date) => {
    timestamp.text(date.toDateString() + ' ' + date.toLocaleTimeString());
    const bikePoints = bikeLocationsAtTime(bbData.bikes, date);
    drawBikes(bikePoints, projection, bikeLayer, delayMsec);
    const stationPoints = stationBikeCountsAtTime(bbData.stations, date);
    drawNumBikesStations(stationPoints, projection, stationLayer, delayMsec, maxNumBikes);
  }

  for (let t = minDate; t < maxDate; t = new Date(t.getTime() + timeStepMsec)) {
    await Promise.all([
      setTimeoutPromise(delayMsec),
      draw(t),
    ]);
  }
}

async function showFlow(load) {
  const {
    timestamp, bikeLayer, stationLayer, delayMsec,
    minDate, maxDate, timeStepMsec, projection, bbData
  } = load;

  let minFlow = 0;
  let maxFlow = 0;
  let flowData = [];
  let dates = [];
  for (let t = minDate; t < maxDate; t = new Date(t.getTime() + timeStepMsec)) {
    const stationPoints = stationFlowsInTimeInterval(bbData.stations, last(dates) || new Date(0), t);
    flowData.push(stationPoints);
    dates.push(t);
    for (let station of stationPoints) {
      minFlow = Math.min(minFlow, station.flow);
      maxFlow = Math.max(maxFlow, station.flow);
    }
  }

  const draw = (i) => {
    const date = dates[i];
    timestamp.text(date.toDateString() + ' ' + date.toLocaleTimeString());
    const bikePoints = bikeLocationsAtTime(bbData.bikes, date);
    drawBikes(bikePoints, projection, bikeLayer, delayMsec);
    const stationPoints = flowData[i];
    drawFlowStations(stationPoints, projection, stationLayer, delayMsec, minFlow, maxFlow);
  }

  for (let i in dates) {
    await Promise.all([
      setTimeoutPromise(delayMsec),
      draw(i),
    ]);
  }
}

async function main(sizeNotFlow=false) {
  const svg = d3.select('body')
    .append('svg');
  const timestamp = d3.select('body')
    .insert('div', ':first-child')
    .style('color', 'white')
    .style('font-size', '24px');

  const delayMsec = 1000;
  const minDate = new Date('2019-02-01 00:00:00');
  const maxDate = new Date('2019-02-02 00:00:01');
  const timeStepMsec = 60 * 60 * 1000; // 15 minutes

  const [projection, bbData] = await Promise.all([
    getMapData().then(mapJSON => drawMap(mapJSON, svg)),
    getBlueBikesData(sizeNotFlow)
  ]);

  const bikeLayer = svg.append("g").attr("id", "bike-layer");
  const stationLayer = svg.append("g").attr("id", "station-layer");

  const load = {
    timestamp, bikeLayer, stationLayer, delayMsec,
    minDate, maxDate, timeStepMsec, projection, bbData
  };

  if (sizeNotFlow) {
    showSize(load);
  } else {
    showFlow(load);
  }
}

main(true);
