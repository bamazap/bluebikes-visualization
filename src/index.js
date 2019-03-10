
import * as d3 from 'd3';
import { getMapData, getBlueBikesData } from './data-loading';
import { drawMap, drawBikes, drawStations } from './draw';
import { bikeLocationsAtTime, stationBikeCountsAtTime } from './data-processing';
import { setTimeoutPromise } from './utils';

async function main() {
  const timestamp = d3.select('body')
    .append('div')
    .style('color', 'white')
    .style('font-size', '24px');

  const svg = d3.select('body')
    .append('svg')
    // .attr('width', 700)
    // .attr('height', 680);

  const [projection, bbData] = await Promise.all([
    getMapData().then(mapJSON => drawMap(mapJSON, svg)),
    getBlueBikesData()
  ]);

  const bikeLayer = svg.append("g").attr("id", "bike-layer")
  const stationLayer = svg.append("g").attr("id", "station-layer")

  const maxStationSize = Math.max(...Object.values(bbData.stations)
    .map(({ bikeCounts }) => Math.max(...bikeCounts.map(bc => bc.numBikes))));

  const draw = (t, delayMsec) => {
    timestamp.text(t.toLocaleString());
    const bikePoints = bikeLocationsAtTime(bbData.bikes, t);
    drawBikes(bikePoints, projection, bikeLayer, delayMsec);
    const stationPoints = stationBikeCountsAtTime(bbData.stations, t);
    drawStations(stationPoints, projection, stationLayer, delayMsec, maxStationSize);
  }
  const minDate = new Date('2019-02-01 00:00:00');
  const maxDate = new Date('2019-02-02 00:00:01');
  const timeStepMsec = 30 * 60 * 1000; // 15 minutes
  for (let t = minDate; t < maxDate; t = new Date(t.getTime() + timeStepMsec)) {
    await Promise.all([
      setTimeoutPromise(1000),
      draw(t, 1000),
    ])
  }
}

main();
