
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import 'leaflet-draw/dist/leaflet.draw-src.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'js-datepicker/dist/datepicker.min.css'
import 'nouislider/distribute/nouislider.css';
import './styles.css';
import { drawFlowStations, drawLegend, drawStations } from './draw';
import { stationsInTimeIntervalAndRegion } from './data-processing';
import getBlueBikesData from './data-loading';
import { makeTimeIntervalIterator } from './time-iterators';
import setUpFilters from './filters';

async function draw(bbData, filterOptions) {
  const iterator = makeTimeIntervalIterator(filterOptions);
  const stationPoints = await stationsInTimeIntervalAndRegion(bbData, iterator, filterOptions.region, filterOptions.regionSelectMode);
  //const stationPoints = stationsInRegion(stationPointsFilteredTime, filterOptions.region);
  let minFlow = 0;
  let maxFlow = 0;
  let minAbs = 0;
  for (let station of stationPoints) {
    minFlow = Math.min(minFlow, station.numBikesDelta);
    maxFlow = Math.max(maxFlow, station.numBikesDelta);
    minAbs = Math.min(minAbs, Math.abs(station.numBikesDelta));
  } 
  drawFlowStations(stationPoints, minFlow, maxFlow);
  drawLegend(Math.max(Math.abs(maxFlow), Math.abs(minFlow)), minAbs);
}

async function main() {
  document.querySelector('body').style = '';
  const bbData = await getBlueBikesData();
  drawStations(Object.values(bbData.stations));
  setUpFilters((filterOptions) => {
    draw(bbData, filterOptions);
  });
}

main();
