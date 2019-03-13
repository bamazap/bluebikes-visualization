import 'js-datepicker/dist/datepicker.min.css'
import 'nouislider/distribute/nouislider.css';
import * as datepicker from 'js-datepicker';
import * as noUiSlider from 'nouislider';
import { setChangeAreaCallback } from './draw';

const MIN_DATE = new Date(2018, 0, 1); // UTC breaks datepicker
const MAX_DATE = new Date(2019, 0, 1);
const INIT_MIN_DATE = new Date(Date.UTC(2018, 8, 14));
const INIT_MAX_DATE = new Date(Date.UTC(2018, 8, 21));

const MS_PER_MINUTE = 60000;
const timezoneOffset = (new Date()).getTimezoneOffset() * MS_PER_MINUTE;

export default function setUpFilters(onChange) {
  // state
  const filterOptions = {
    minDate: INIT_MIN_DATE,
    maxDate: INIT_MAX_DATE,
    minTime: 0,
    maxTime: 24,
    days: new Set(),
    region: null, // a Leaflet LatLng object describing the selected square, falsy if nothing selected
    regionSelectMode: "both"
  };

  // day filters 
  datepicker("#startpicker", {
    id: 1,
    minDate: MIN_DATE,
    maxDate: INIT_MAX_DATE,
    dateSelected: INIT_MIN_DATE,
    onSelect: (instance, date) => {
      // This will set the min for the other picker as well .
      instance.setMin(date);
      filterOptions.minDate = new Date(date.getTime() - timezoneOffset);
      onChange(filterOptions);
    },
    formatter: (input, date) => {
      const value = date.toLocaleDateString()
      input.value = value // => '1/1/2099'
    }
  });
  datepicker("#endpicker", {
    id: 1,
    minDate: INIT_MIN_DATE,
    maxDate: MAX_DATE,
    dateSelected: INIT_MAX_DATE,
    onSelect: (instance, date) => {
      // This will set the min for the other picker as well .
      instance.setMax(date);
      filterOptions.maxDate = new Date(date.getTime() - timezoneOffset);
      onChange(filterOptions);
    },
    formatter: (input, date) => {
      const value = date.toLocaleDateString()
      input.value = value // => '1/1/2099'
    },
    position: 'br'
  });

  // day of week filters 
  Array.from(document.getElementsByClassName("week-button")).forEach((elt) => {
    elt.onclick = () => {
      elt.classList.toggle("selected");
      const day = parseInt(elt.value, 10);
      if (filterOptions.days.has(day)) {
        filterOptions.days.delete(day);
      } else {
        filterOptions.days.add(day);
      }
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

  // area filters 
  const onChangeArea = (region) => {
    filterOptions.region = region;
    onChange(filterOptions);
  }
  setChangeAreaCallback(onChangeArea);

  // region mode selection
  Array.from(document.getElementsByClassName("region-selection-option")).forEach((elt) => {
    elt.onclick = () => {
      if (filterOptions.regionSelectMode != elt.value) {
        filterOptions.regionSelectMode = elt.value;
        onChange(filterOptions);
      }
    };
  });

}
