
import './styles.css';
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import 'js-datepicker/dist/datepicker.min.css'
import * as d3 from 'd3';
import { last } from 'lodash';
import { getBlueBikesData } from './data-loading';
import { drawBikes, drawNumBikesStations, drawFlowStations } from './draw';
import { bikeLocationsAtTime, stationBikeCountsAtTime, stationsInTimeInterval } from './data-processing';
import { setTimeoutPromise } from './utils';
import * as datepicker from 'js-datepicker';

// params
const initMinDate = new Date('2019-02-01 00:00:00');
const initMaxDate = new Date('2019-02-02 00:00:01');

// global data vars
var bbData;
var filterOptions = {
  minDate: initMinDate,
  maxDate: initMaxDate
};
var startPicker;
var endPicker;

function setUpFilters() {
  startPicker = datepicker("#startpicker", {
    id: 1,
    maxDate: initMaxDate,
    minDate: initMinDate,
    startDate: initMinDate,
    onSelect: (instance, date) => {
      // This will set the min for the other picker as well .
      instance.setMin(date);
      filterOptions.minDate = date;
    }
  });
  endPicker = datepicker("#endpicker", {
    id: 1,
    maxDate: initMaxDate,
    minDate: initMinDate,
    startDate: initMinDate,
    onSelect: (instance, date) => {
      // This will set the min for the other picker as well .
      instance.setMax(date);
      filterOptions.maxDate = date;
    }
  });
}

function setSelectedDates(min, max) {
  console.log("new dates:", min, max);
  startPicker.setDate(min, true);
  filterOptions.minDate = min;
  endPicker.setDate(max, true);
  filterOptions.maxDate = max;
}

function draw(filterOptions) { // bikePoints, stationPoints) {
  // const date = dates[i];
  // timestamp.text(date.toDateString() + ' ' + date.toLocaleTimeString());
  // const bikePoints = bikeLocationsAtTime(bbData.bikes, date);
  const bikePoints = bikeLocationsAtTime(bbData.bikes, filterOptions.maxDate);
  const stationPoints = stationsInTimeInterval(bbData.stations, filterOptions.minDate, filterOptions.maxDate);
  console.log("stationPoints", stationPoints);

  const maxNumBikes = Math.max(...Object.values(stationPoints).map(s => s.numBikes));
  drawBikes(bikePoints);
  // const stationPoints = flowData[i];
  //if (sizeNotFlow) {
    console.log("maxNumBikes", maxNumBikes);
    drawNumBikesStations(stationPoints, maxNumBikes);
  // } else {
  //   drawFlowStations(stationPoints, minFlow, maxFlow);
  // }
}

async function main() {
  const timestamp = d3.select('#timestamp')

  // parameters
  const timeStepMsec = 60 * 60 * 1000;
  const delayMsec = 1000; // time between display changes
  const sizeNotFlow = false;

  bbData = await getBlueBikesData(sizeNotFlow);
  console.log("bbData.stations", bbData.stations);

  // aggregate calculations needed by the draw functions
  //const maxNumBikes = Math.max(...Object.values(bbData.stations).map(s => s.maxNumBikes));
  // let minFlow = 0;
  // let maxFlow = 0;
  // let flowData = [];
  // let dates = [];
  // for (let t = minDate; t < maxDate; t = new Date(t.getTime() + timeStepMsec)) {
  //   const stationPoints = stationsInTimeInterval(bbData.stations, last(dates) || new Date(0), t);
  //   flowData.push(stationPoints);
  //   dates.push(t);
  //   for (let station of stationPoints) {
  //     minFlow = Math.min(minFlow, station.numBikesDelta);
  //     maxFlow = Math.max(maxFlow, station.numBikesDelta);
  //   }
  // }

  // set up filters
  setUpFilters();

  let dates = [];
  for (let t = initMinDate; t <= initMaxDate; t = new Date(t.getTime() + timeStepMsec)) {
    //const stationPoints = stationsInTimeInterval(bbData.stations, last(dates) || new Date(0), t);
    //flowData.push(stationPoints);
    dates.push(t);
  }
  console.log("dates", dates);

  // method to update the view for the i'th timestep
  // const draw = (i) => {
  //   const date = dates[i];
  //   timestamp.text(date.toDateString() + ' ' + date.toLocaleTimeString());
  //   const bikePoints = bikeLocationsAtTime(bbData.bikes, date);
  //   drawBikes(bikePoints);
  //   const stationPoints = flowData[i];
  //   if (sizeNotFlow) {
  //     drawNumBikesStations(stationPoints, maxNumBikes);
  //   } else {
  //     drawFlowStations(stationPoints, minFlow, maxFlow);
  //   }
  // }

  // draw the timesteps over time
  const drawNext = (i, dates) => {
    console.log("dates to know", dates[i], dates[i+1]);
    // set selected options on the filters 
    setSelectedDates(dates[i], dates[i+1]);
    draw(filterOptions);
  }

  for (let i = 0; i < dates.length -1; i++) {
    console.log("i", i);
    await Promise.all([
      setTimeoutPromise(delayMsec),
      drawNext(i, dates)
    ]);
  }
}

main();
