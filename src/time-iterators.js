function getIndex(bbData, date, roundUp=true) {
  let floatIndex = (date.getTime() - bbData.firstTime) / bbData.timestepMsec;
  let index = Math.floor(floatIndex);
  if (!roundUp && floatIndex === index) {
    index -= 1;
  }
  return index;
}

const ALL_DAYS = new Set([0, 1, 2, 3, 4, 5, 6]);

export function makeTimeIntervalIterator(filters) {
  let { minDate, maxDate, minTime, maxTime, days } = filters;
  if (days.size === 0) days = ALL_DAYS;
  let hour = minDate.getHours();
  let day = minDate.getDay();
  return async (bbData, callback) => {
    const i1 = Math.max(getIndex(bbData, minDate), 0);
    const i2 = getIndex(bbData, maxDate, false);
    for (let i = i1; i <= i2; i += 1) {
      // call index if in time filter
      if (
        hour >= minTime
        && hour <= maxTime
        && days.has(day)
      ) {
        const datum = await bbData.getData(i);
        if (datum) {
          callback(datum);
        }
      }
      // update
      hour += 1;
      if (hour === 24) {
        hour = 0;
        day += 1;
        if (day === 7) {
          day = 0;
        }
      }
    }
  }
}
