import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import * as L from 'leaflet';
//import * as ld from 'leaflet-draw';
import 'leaflet-draw';
import * as d3 from 'd3';

const token = 'pk.eyJ1IjoiYmFtYXphcCIsImEiOiJjanQ0amR6dHIxM3YxNDlsbDJxZXFoaTEwIn0.HXt22ulQoeU3Xq1T7fSTRg';

// used to convert units consistently
// if you change this you may need to adjust your radius scaling
const baseZoom = 13;
// create a map using Leaflet
const map = L.map('map', {
  center: [42.3601, -71.0589],
  zoom: baseZoom,
  minZoom: 12,
  //drawControl: true 
});

var changeAreaCallback = function() {};

L.tileLayer(`https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}`, {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox.streets',
  token,
}).addTo(map);

// var editableLayers = new L.FeatureGroup();
// map.addLayer(editableLayers);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
  draw: {
   polygon: false,
   marker: false, 
   circle: false,
   circlemarker: false,
   polyline: false
  },
  edit: {
    featureGroup: drawnItems
  }
});
map.addControl(drawControl);

map.on(L.Draw.Event.DRAWSTART, function(e) {
  //drawnItems.clearLayers();
});

map.on(L.Draw.Event.CREATED, function (e) {
  var type = e.layerType,
      layer = e.layer;

  drawnItems.clearLayers();

  drawnItems.addLayer(layer);

  changeAreaCallback(layer.getBounds());
});

document.getElementById("region-select").onclick = () => {
  // const rect = new L.Draw.Rectangle();
  // rect.initialize();
  document.getElementsByClassName("leaflet-draw-draw-rectangle")[0].click();
}

document.getElementById("region-clear").onclick = () => {
  // const rect = new L.Draw.Rectangle();
  // rect.initialize();
  drawnItems.clearLayers();
  changeAreaCallback(null);
}


// create an svg layer and get it with d3
L.svg().addTo(map);
const svg = d3.select('#map').select('svg').style('pointer-events', 'all');
const stationLayer = svg.append("g").attr("class", "station-layer");

const legendLayer = d3.select("#legend").append("svg").append("g").attr("class", "legend-layer");

// go from a latlng to pixel coordinates on the map
function geoTranslate(d) {
  const { x, y } = map.latLngToLayerPoint(d.latlng);
  return `translate(${x}, ${y})`;
}

// go from a rather unitless size to a distance on the map
function geoScale(r) {
  return r * map.getZoomScale(map.getZoom(), baseZoom)
}

function calcSize(flow, maxFlow) {
  return geoScale(2 + 10 * (Math.abs(flow) / maxFlow) ** .5);
}

function calcColor(nBikesDelta) {
  return d3.interpolatePuOr(.5 * Math.sign(nBikesDelta) + .5);
}

// go from rgb string to rgba string
function rgba(rgb, a) {
  return `${rgb.slice(0, -1)},${a})`;
}

// automatically position and size all circles created by drawCoordinates
let lastZoom = map.getZoom();
map.on('zoomend', () => {
  const coordinateSelection = svg.selectAll('circle.coordinate');
  coordinateSelection.attr('transform', geoTranslate);
  const newZoom = map.getZoom();
  if (lastZoom !== newZoom) {
    const scale = map.getZoomScale(newZoom, lastZoom);
    coordinateSelection.attr('r', function() {
      return parseFloat(d3.select(this).attr('r')) * scale;
    });
    lastZoom = newZoom;
  }
});

export function setChangeAreaCallback(f) {
  changeAreaCallback = f;
}

/**
 * Draw coordinates on the map
 * @param {{ id, latitiude: number, longitude: number}[]} coordinates 
 * @param {d3.Selection} layer -   to draw in
 * @param {string} cls - class to add (needed to have separate coordinate sets) 
 * @param {number} transitionDuration - msec movement animation should take
 */
function drawCoordinates(coordinates, layer, cls='c', transitionDuration=750) {
  coordinates.forEach((coord) => {
    coord.latlng = new L.LatLng(coord.latitude, coord.longitude);
  });

  const coordinateSelection = layer.selectAll(`circle.coordinate.${cls}`)
    .data(coordinates, d => d.id)
    .join("circle")
      .attr('class', `coordinate ${cls}`)
      .attr('transform', geoTranslate);

  return coordinateSelection;
}

export function drawFlowStations(stations, maxNegativeFlow, maxPositiveFlow) {
  const color = (d) => calcColor(d.numBikesDelta);
  const maxFlow = Math.max(Math.abs(maxNegativeFlow), Math.abs(maxPositiveFlow), 1);

  const stationSelection = drawCoordinates(stations, stationLayer, 'station')
    .attr('r', d => {
        return calcSize(d.numBikesDelta, maxFlow);
      })
      // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
      // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
      .attr('fill', d => rgba(color(d), 0.2))
      .attr('stroke', color);
  addStationAnimation(stationSelection);
}

function addStationAnimation(stationSelection) {
  stationSelection.on('click', d => { stationLayer.selectAll('line')
    .data(d.rankedTargets, d2 => d2.station.id)
    .join('line')
    .attr("x1", d2 => map.latLngToLayerPoint(
      new L.LatLng(d2.station.latitude, d2.station.longitude)
    ).x)
    .attr("y1", d2 => map.latLngToLayerPoint(
      new L.LatLng(d2.station.latitude, d2.station.longitude)
    ).y)
    .attr("x2", map.latLngToLayerPoint(d.latlng).x)
    .attr("y2", map.latLngToLayerPoint(d.latlng).y)
    .attr('stroke', 'red')
  });
}

export function drawLegend(maxFlow, minFlow) {
  const padding = 40;
  const w = 300 + 2*padding;
  const h = calcSize(maxFlow, maxFlow)*4 + 2*padding;
  d3.select("#legend").attr("height", h + "px").attr("width", w + "px");
  d3.select("#legend svg").attr("height", h + "px").attr("width", w + "px");

  const cls = "legend-circle";
  // const legendLayer = document.getElementById("legend").append("svg");
  const vals = [maxFlow, (maxFlow+minFlow)/2, Math.max(minFlow, 1)];

  const legendElts = [];
  const labels = [];
  for (let i = 0; i < 6; i++) {
    let val = vals[i%3];
    let color = (d) => calcColor(i%2 ? -val : val);
    let row = i % 3;
    let col = i % 2; 
    let x = (w-2*padding)/4*(1+2*col) - 40; 
    let y = (h-2*padding)/2*(1+2*row);
    legendElts.push({id: i, val, color, x, y});
    let text = val + " bikes " + (i%2 ? "removed" : "added");
    labels.push({id: i, val, x, y, text});
  }

  const sel = legendLayer.selectAll(`circle.coordinate.${cls}`)
    .data(legendElts, (d) => d.id )
    .join("circle")
      .attr('class', `coordinate ${cls}`)
      .attr("transform", (d) => {
        return "translate(" + d.x + "," + d.y + ")";
      })
      .attr('r', d => {
          const r = calcSize(d.val, maxFlow);
          return r;
        })
        // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
        // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
        .attr('fill', d => rgba(d.color(d.val), 0.2))
        .attr('stroke', d => d.color(d.val));

  const legendLabels = legendLayer.selectAll("text")
    .data(labels, (d) => d.id)
    .join("text")
      .attr("transform", (d) => {
        return "translate(" + (d.x + 15) + "," + (d.y + 5) + ")";
      })
      .text((d) => d.text);
}
