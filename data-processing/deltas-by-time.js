const d3 = require('d3');
const path = require('path');
const fs = require('fs');

process.env.TZ = 'UTC'; 
Date.prototype.numDaysInMonth = function() {
  const d= new Date(this.getFullYear(), this.getMonth() + 1, 0);
  return d.getDate();
}

function getOrSetDefault(obj, key, def) {
  if (!(key in obj)) {
    obj[key] = def;
  }
  return obj[key];
}

function getCSV(filename) {
  const filepath = path.join(__dirname, '..', 'raw-data', `${filename}.csv`);
  const data = fs.readFileSync(filepath, 'utf8');
  return d3.csvParse(data);
}

function writeObjectToJSON(filename, obj) {
  const jsonPath = path.join(__dirname, '..', 'data', `${filename}.json`);
  const data = JSON.stringify(obj);
  fs.writeFileSync(jsonPath, data);
}

const ONE_HOUR_MSEC = 60 * 60 * 1000;
function main() {
  const initialLocations = {}; // where each bike starts
  const stations = {}; // name + lat + lng for each station
  let numTimestampsEachMonth = [];

  function getStationIDs(row) {
    return ['start', 'end'].map(point => {
      const stationID = parseInt(row[`${point} station id`], 10);
      if (!(stationID in stations)) {
        const name = row[`${point} station name`];
        const latitude = parseFloat(row[`${point} station latitude`]);
        const longitude = parseFloat(row[`${point} station longitude`]);
        stations[stationID] = {
          name,
          latitude,
          longitude
        };
      }
      return stationID
    });
  }

  function maybeSetBikeInitialStation(row, startStationID) {
    const bikeID = parseInt(row.bikeid, 10);
    if (!(bikeID in initialLocations)) {
      initialLocations[bikeID] = startStationID;
    }
  }

  for (let i = 0; i <= 11; i += 1) { // each month's data
    const firstDate = (new Date(`2018-${i + 1}-01 00:00:00`));
    const firstTime = firstDate.getTime();
    const numTimestepsInMonth = firstDate.numDaysInMonth() * 24;
    const data = [];
    for (let t = 0; t < numTimestepsInMonth; t += 1) {
      data.push({});
    }
  
    const rows = getCSV(i + 1);
    rows.forEach(row => {
      // get row data
      const [startStationID, endStationID] = getStationIDs(row);
      const startDate = new Date(row.starttime);
      // const endDate = new Date(row.endtime);

      // populate initial state if needed
      maybeSetBikeInitialStation(row, startStationID);

      // add the ride
      const date = startDate;
      const timestep = Math.floor((date.getTime() - firstTime) / ONE_HOUR_MSEC);
      const timestepData = data[timestep];
      const sourceData = getOrSetDefault(timestepData, startStationID, {});
      sourceData[endStationID] = (sourceData[endStationID] || 0) + 1;
    });

    writeObjectToJSON(`month-${i}`, data);
    numTimestampsEachMonth.push(numTimestepsInMonth);
  }

  writeObjectToJSON('info', {
    initialLocations,
    stations,
    timestepMsec: ONE_HOUR_MSEC,
    numTimestampsEachMonth,
    firstTime: (new Date('2018-01-01 00:00:00')).getTime()
  });
}

main();
