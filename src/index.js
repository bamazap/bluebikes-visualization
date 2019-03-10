
import * as d3 from 'd3';

import { getMapData, getBikeData, dataForTime, getStationData, bikeCountsOverTime } from './data';
import { drawMap, drawGeoCoords, drawSizedGeoCoords } from './draw';



async function main() {
  const svg = d3.select('body')
    .append('svg')
    // .attr('width', 700)
    // .attr('height', 680);

  const [projection, sData] = await Promise.all([
    getMapData().then(mapJSON => drawMap(mapJSON, svg)),
    getStationData(),
  ]);

  // // for now, only show so many bikes
  // // TODO: figure out how to make N bikes per station meaningful
  // Object.keys(bbData).sort().slice(50).forEach((id) => {
  //   delete bbData[id];
  // });

  // function drawAtTime(t, maxt) {
  //   const points = stationSizeAtTime(sData, t);
  //   drawSizedGeoCoords(points, projection, svg);
  //   const newT = new Date(t.getTime() + (60 * 60 * 1000)); // plus one hour
  //   if (newT < maxt) {
  //     setTimeout(() => drawAtTime(newT, maxt), 500);
  //   }
  // }

  const t = new Date('2019-02-01 00:00:00');
  const maxt = new Date('2019-03-01 00:00:00');
  // drawAtTime(t, maxt);

  const steps = bikeCountsOverTime(sData, t, maxt, 60 * 60 * 1000, (data) => {
    drawSizedGeoCoords(data, projection, svg, 200);
  }, 200);
}

main();
