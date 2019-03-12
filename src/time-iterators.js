function getIndex(bbData, date, roundUp=true) {
  let floatIndex = (date.getTime() - bbData.firstTime) / bbData.timestepMsec;
  let index = Math.floor(floatIndex);
  if (!roundUp && floatIndex === index) {
    index -= 1;
  }
  return index;
}

export function makeTimeIntervalIterator(date1, date2) {
  return async (bbData, callback) => {
    const i1 = Math.max(getIndex(bbData, date1), 0);
    const i2 = getIndex(bbData, date2, false);
    for (let i = i1; i <= i2; i += 1) {
      const datum = await bbData.getData(i);
      if (datum) {
        callback(datum);
      }
    }
  }
}
