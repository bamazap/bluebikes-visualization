
import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import 'js-datepicker/dist/datepicker.min.css'
import 'nouislider/distribute/nouislider.css';
import './styles.css';
import { drawFlowStations } from './draw';
import { stationsInTimeInterval } from './data-processing';
import * as datepicker from 'js-datepicker';
import * as noUiSlider from 'nouislider';
import getBlueBikesData from './data-loading';
import { makeTimeIntervalIterator } from './time-iterators';

// params
const INIT_MIN_DATE = new Date(Date.UTC(2018, 0, 1));
const INIT_MAX_DATE = new Date(Date.UTC(2019, 0, 1));

function setUpFilters(onChange) {
  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

  // state
  const filterOptions = {
    minDate: INIT_MIN_DATE,
    maxDate: INIT_MAX_DATE,
    minTime: 0,
    maxTime: 24
  };

  // day filters 
  datepicker("#startpicker", {
    id: 1,
    maxDate: INIT_MAX_DATE,
    minDate: INIT_MIN_DATE,
    startDate: INIT_MIN_DATE,
    onSelect: (instance, date) => {
      // This will set the min for the other picker as well .
      instance.setMin(date);
      filterOptions.minDate = date;
      onChange(filterOptions);
    }
  });
  datepicker("#endpicker", {
    id: 1,
    maxDate: INIT_MAX_DATE,
    minDate: INIT_MIN_DATE,
    startDate: INIT_MAX_DATE,
    onSelect: (instance, date) => {
      // This will set the min for the other picker as well .
      instance.setMax(date);
      filterOptions.maxDate = date;
      onChange(filterOptions);
    }
  });

  // day of week filters 
  filterOptions.days = ALL_DAYS;
  Array.from(document.getElementsByClassName("week-button")).forEach((elt) => {
    elt.onclick = () => {
      elt.classList.toggle("selected");
      let selectedDays = Array.from(document.getElementsByClassName("week-button"))
        .map((elt) => elt.classList.contains("selected") ? elt.value : false)
        .filter((elt) => !!elt);
      filterOptions.days = selectedDays.length > 0 ? selectedDays : ALL_DAYS;
      onChange(filterOptions);
    }
  });

  // time filters
  const slider = document.getElementById('time-slider');
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
  slider.noUiSlider.on('update', (values) => {
    const cleanVals = values.map((elt) => parseInt(elt.replace(":00", "")));
    [filterOptions.minTime, filterOptions.maxTime] = cleanVals;
    onChange(filterOptions);
  });
}

async function draw(bbData, filterOptions) {
  const iterator = makeTimeIntervalIterator(filterOptions.minDate, filterOptions.maxDate);
  const stationPoints = await stationsInTimeInterval(bbData, iterator);
  let minFlow = 0;
  let maxFlow = 0;
  for (let station of stationPoints) {
    minFlow = Math.min(minFlow, station.numBikesDelta);
    maxFlow = Math.max(maxFlow, station.numBikesDelta);
  } 
  drawFlowStations(stationPoints, minFlow, maxFlow);
}

async function main() {
  const bbData = await getBlueBikesData();
  setUpFilters((filterOptions) => {
    draw(bbData, filterOptions);
  });
}

main();
