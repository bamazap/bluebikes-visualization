
import './styles.css';
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import * as d3 from 'd3';
import { last } from 'lodash';
import { getBlueBikesData } from './data-loading';
import { drawBikes, drawNumBikesStations, drawFlowStations } from './draw';
import { bikeLocationsAtTime, stationBikeCountsAtTime, stationsInTimeInterval } from './data-processing';
import { setTimeoutPromise } from './utils';

async function main() {
  const timestamp = d3.select('#timestamp')

  // parameters
  const minDate = new Date('2019-02-01 00:00:00');
  const maxDate = new Date('2019-02-02 00:00:01');
  const timeStepMsec = 60 * 60 * 1000;
  const delayMsec = 1000; // time between display changes
  const sizeNotFlow = true;

  const bbData = await getBlueBikesData(sizeNotFlow);

  // aggregate calculations needed by the draw functions
  const maxNumBikes = Math.max(...Object.values(bbData.stations).map(s => s.maxNumBikes));
  let minFlow = 0;
  let maxFlow = 0;
  let flowData = [];
  let dates = [];
  for (let t = minDate; t < maxDate; t = new Date(t.getTime() + timeStepMsec)) {
    const stationPoints = stationsInTimeInterval(bbData.stations, last(dates) || new Date(0), t);
    flowData.push(stationPoints);
    dates.push(t);
    for (let station of stationPoints) {
      minFlow = Math.min(minFlow, station.numBikesDelta);
      maxFlow = Math.max(maxFlow, station.numBikesDelta);
    }
  }

  // method to update the view for the i'th timestep
  const draw = (i) => {
    const date = dates[i];
    timestamp.text(date.toDateString() + ' ' + date.toLocaleTimeString());
    const bikePoints = bikeLocationsAtTime(bbData.bikes, date);
    drawBikes(bikePoints);
    const stationPoints = flowData[i];
    if (sizeNotFlow) {
      drawNumBikesStations(stationPoints, maxNumBikes);
    } else {
      drawFlowStations(stationPoints, minFlow, maxFlow);
    }
  }

  // draw the timesteps over time
  for (let i in dates) {
    await Promise.all([
      setTimeoutPromise(delayMsec),
      draw(i),
    ]);
  }
}

main();
