
import * as d3 from 'd3';

import { getMapData, getBikeData, dataForTime } from './data';
import { drawMap, drawGeoCoords } from './draw';


async function main() {
  const svg = d3.select('body')
    .append('svg')
    .attr('width', 700)
    .attr('height', 680);

  const [projection, bbData] = await Promise.all([
    getMapData().then(mapJSON => drawMap(mapJSON, svg)),
    getBikeData(),
  ]);

  // for now, only show so many bikes
  // TODO: figure out how to make N bikes per station meaningful
  Object.keys(bbData).sort().slice(50).forEach((id) => {
    delete bbData[id];
  });

  function drawAtTime(t, maxt) {
    const points = dataForTime(bbData, t);
    drawGeoCoords(points, projection, svg);
    const newT = new Date(t.getTime() + (60 * 60 * 1000)); // plus one hour
    if (newT < maxt) {
      setTimeout(() => drawAtTime(newT, maxt), 500);
    }
  }

  const t = new Date('2019-02-01 00:00:00');
  const maxt = new Date('2019-02-02 00:00:00');
  drawAtTime(t, maxt);
}

main();
