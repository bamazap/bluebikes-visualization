
import './styles.css';
import { drawFlowStations } from './draw';
import { stationsInTimeInterval } from './data-processing';
import getBlueBikesData from './data-loading';
import { makeTimeIntervalIterator } from './time-iterators';
import setUpFilters from './filters';

async function draw(bbData, filterOptions) {
  const iterator = makeTimeIntervalIterator(filterOptions);
  const stationPoints = await stationsInTimeInterval(bbData, iterator);
  let minFlow = 0;
  let maxFlow = 0;
  for (let station of stationPoints) {
    minFlow = Math.min(minFlow, station.numBikesDelta);
    maxFlow = Math.max(maxFlow, station.numBikesDelta);
  } 
  drawFlowStations(stationPoints, minFlow, maxFlow);
}

async function main() {
  document.querySelector('body').style = '';
  const bbData = await getBlueBikesData();
  setUpFilters((filterOptions) => {
    draw(bbData, filterOptions);
  });
}

main();
