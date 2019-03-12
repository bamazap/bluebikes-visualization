
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import 'js-datepicker/dist/datepicker.min.css'
import 'nouislider/distribute/nouislider.css';
import './styles.css';
import * as d3 from 'd3';
import { last } from 'lodash';
import { getBlueBikesData } from './data-loading';
import { drawBikes, drawNumBikesStations, drawFlowStations } from './draw';
import { bikeLocationsAtTime, stationBikeCountsAtTime, stationsInTimeInterval } from './data-processing';
import { setTimeoutPromise } from './utils';
import * as datepicker from 'js-datepicker';
import * as noUiSlider from 'nouislider';

// params
const initMinDate = new Date('2019-02-01 00:00:00');
const initMaxDate = new Date('2019-02-02 00:00:01');
const allDays = [0, 1, 2, 3, 4, 5, 6];
const sizeNotFlow = false;

// global data vars
var bbData;
var filterOptions = {
  minDate: initMinDate,
  maxDate: initMaxDate,
  minTime: 0,
  maxTime: 24
};
var startPicker;
var endPicker;

function setUpFilters() {
  // day filters 
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

  // day of week filters 
  filterOptions.days = allDays;
  console.log("week buttons", document.getElementsByClassName("week-button"));
  Array.from(document.getElementsByClassName("week-button")).forEach((elt) => {
    elt.onclick = function() {
      elt.classList.toggle("selected");
      var selectedDays = Array.from(document.getElementsByClassName("week-button"))
      .map((elt) => elt.classList.contains("selected") ? elt.value : false)
      .filter((elt) => !!elt);
      console.log("selected days before ternary", selectedDays);
      selectedDays = selectedDays.length > 0 ? selectedDays : allDays;
      console.log("selectedDays", selectedDays);
    }
  });

  var slider = document.getElementById('time-slider');

  noUiSlider.create(slider, {
    start: [0, 24],
    connect: true,
    tooltips: true,
    step: 1,
    range: {
        'min': 0,
        'max': 24
    },
    format: {
        to: (n) => Math.round(n) + ":00",
        from: (n) => parseInt(n.replace(":00", ""))
    }
  });

  slider.noUiSlider.on('update', function(values, handle) {
    const cleanVals = values.map((elt) => parseInt(elt.replace(":00", "")));
    [filterOptions.minTime, filterOptions.maxTime] = cleanVals;
    console.log("filterOptions", filterOptions);
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
  // TODO: fix how bike locations are updated 
  const bikePoints = bikeLocationsAtTime(bbData.bikes, filterOptions.maxDate);
  const stationPoints = stationsInTimeInterval(bbData.stations, filterOptions.minDate, filterOptions.maxDate);
  console.log("stationPoints", stationPoints);
  let minFlow = 0;
  let maxFlow = 0;
  for (let station of stationPoints) {
    minFlow = Math.min(minFlow, station.numBikesDelta);
    maxFlow = Math.max(maxFlow, station.numBikesDelta);
  } 

  const maxNumBikes = Math.max(...Object.values(stationPoints).map(s => s.numBikes));
  drawBikes(bikePoints);
  // const stationPoints = flowData[i];
  if (sizeNotFlow) {
    console.log("maxNumBikes", maxNumBikes);
    drawNumBikesStations(stationPoints, maxNumBikes);
  } else {
    drawFlowStations(stationPoints, minFlow, maxFlow);
  }
}

async function main() {
  const timestamp = d3.select('#timestamp')

  // parameters
  const timeStepMsec = 60 * 60 * 1000;
  const delayMsec = 1000; // time between display changes

  bbData = await getBlueBikesData(sizeNotFlow);
  console.log("bbData.stations", bbData.stations);

  // set up filters
  setUpFilters();

  let dates = [];
  for (let t = initMinDate; t <= initMaxDate; t = new Date(t.getTime() + timeStepMsec)) {
    //const stationPoints = stationsInTimeInterval(bbData.stations, last(dates) || new Date(0), t);
    //flowData.push(stationPoints);
    dates.push(t);
  }

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
