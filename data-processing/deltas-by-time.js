const d3 = require('d3');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

// like _.get but it sets the default on the object if no value is found
function getOrSetDefault(obj, path, def) {
  const val = _.get(obj, path);
  if (val === undefined) {
    _.set(obj, path, def);
    return def;
  }
  return val;
}

function getCSV(filename) {
  const filepath = path.join(__dirname, '..', 'raw-data', `${filename}.csv`);
  return new Promise((resolve, reject) => {
    fs.readFile(filepath, 'utf8', (readErr, data) => {
      if (readErr) {
        reject(readErr);
      } else {
        try {
          const rows = d3.csvParse(data);
          resolve(rows);
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    });
  });
}

function writeObjectToJSON(filename, obj) {
  const jsonPath = path.join(__dirname, '..', 'data', `${filename}.json`);
  return new Promise((resolve, reject) => {
    fs.writeFile(jsonPath, JSON.stringify(obj), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  const timestepMsec = 60 * 60 * 1000; // one hour

  const initialLocations = {}; // where each bike starts
  const stations = {}; // name + lat + lng for each station
  const allData = []; // each is a timestep data, an object: o[source][target] = count
  let firstDate; // to set

  function getStationIDs(row) {
    return ['start', 'end'].map(point => {
      const stationID = parseInt(row[`${point} station id`], 10);
      if (!(stationID in stations)) {
        const name = parseFloat(row[`${point} station name`]);
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

  function addMove(date, sourceStationID, targetStationID) {
    const timestep = Math.floor((date.getTime() - firstDate.getTime()) / timestepMsec);
    const timestepData = getOrSetDefault(allData, timestep, {});
    const sourceData = getOrSetDefault(timestepData, sourceStationID, {});
    sourceData[targetStationID] = (sourceData[targetStationID] || 0) + 1;
  }

  for (let i = 1; i <= 12; i += 1) { // each month's data
    const rows = await getCSV(i);
    rows.forEach(row => {
      // get row data
      const [startStationID, endStationID] = getStationIDs(row);
      const startDate = new Date(row.starttime);
      // const endDate = new Date(row.endtime);

      // populate initial state if needed
      maybeSetBikeInitialStation(row, startStationID);
      if (firstDate === undefined) {
        firstDate = startDate;
      }

      addMove(startDate, startDate)
    });
  }

  await writeObjectToJSON('data', {
    initialLocations,
    stations,
    data: allData,
    firstDate,
    timestepMsec
  });
}

main();
