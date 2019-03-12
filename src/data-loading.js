import { json as getJSON } from 'd3';

/**
 * Returns an object with everything in data/info.json
 * and a method getData(timestep) that asynchronously
 * gets the correct data for the timestep'th hour
 * (since this data is broken up into multiple files
 * usually the returned promise will resolve immediately
 * but when accessing data for a month from the first time
 * it must be loaded)
 */
export default async function getBlueBikesData() {
  const info = await getJSON('data/info.json');
  const monthlyData = []; // cache

  function getMonthAndIndex(timestep) {
    let offset = timestep;
    for (let i in info.numTimestampsEachMonth) {
      if (offset > info.numTimestampsEachMonth[i]) {
        offset -= info.numTimestampsEachMonth[i];
      } else {
        return [i, offset];
      }
    }
    return [-1, -1];
  }

  return {
    ...info,
    async getData(timestep) {
      const [monthNum, index] = getMonthAndIndex(timestep);
      if (monthNum > 0 && !(monthNum in monthlyData)) {
        monthlyData[monthNum] = await getJSON(`data/month-${monthNum}.json`);
      }
      return index < 0 ? undefined : monthlyData[monthNum][index];
    }
  }
}