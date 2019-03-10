const d3 = require('d3');
const path = require('path');
const fs = require('fs');

const tripDataPath = path.join(__dirname, '..', 'raw-data', '201902-bluebikes-tripdata.csv');
const tripDataText = fs.readFileSync(tripDataPath, 'utf8');
const tripDataRows = d3.csvParse(tripDataText);
const stations = {};
tripDataRows.forEach((datum) => {
  ['start', 'end'].forEach((point) => {
    const stationID = datum[`${point} station id`];
    if (!stations[stationID]) {
      const latitude = parseFloat(datum[`${point} station latitude`]);
      const longitude = parseFloat(datum[`${point} station longitude`]);
      stations[stationID] = {
        latitude,
        longitude,
        deltas: []
      };
    }
    const date = new Date(datum[`${point === 'end' ? 'stop' : 'start'}time`]);
    stations[stationID].deltas.push({ delta: point === 'end' ? 1 : -1, date});
  });
});
Object.values(stations).forEach((stationData) => {
  let size = 0;
  let minSize = 0;
  let maxSize = 0;
  for (let { delta } of stationData.deltas) {
    size += delta;
    minSize = Math.min(minSize, size);
    maxSize = Math.max(maxSize, size);
  }
  stationData.startNumBikes = -1 * minSize;
  stationData.maxNumBikes = maxSize + stationData.startNumBikes;
});
const jsonPath = path.join(__dirname, '..', 'data', 'station-size-deltas.json');
fs.writeFileSync(jsonPath, JSON.stringify(stations));