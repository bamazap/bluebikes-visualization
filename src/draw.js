import * as L from 'leaflet';
import * as d3 from 'd3';

const token = 'pk.eyJ1IjoiYmFtYXphcCIsImEiOiJjanQ0amR6dHIxM3YxNDlsbDJxZXFoaTEwIn0.HXt22ulQoeU3Xq1T7fSTRg';

const baseZoom = 13;
// create a map using Leaflet
const map = L.map('map').setView([42.3601, -71.0589], baseZoom);
L.tileLayer(`https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}`, {
  attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
  maxZoom: 18,
  id: 'mapbox.streets',
  token,
}).addTo(map);
// create an svg layer and get it with d3
L.svg().addTo(map);
const svg = d3.select('#map').select('svg').style('pointer-events', 'all');
// create layers so we can have stations be in front of bikes
const bikeLayer = svg.append("g").attr("class", "bike-layer");
const stationLayer = svg.append("g").attr("class", "station-layer");

// go from a latlng to pixel coordinates on the map
function geoTranslate(d) {
  const { x, y } = map.latLngToLayerPoint(d.latlng);
  return `translate(${x}, ${y})`;
}

// go from a rather unitless size to a distance on the map
function geoScale(r) {
  return r * map.getZoomScale(map.getZoom(), baseZoom)
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

/**
 * Draw coordinates on the map
 * @param {{ id, latitiude: number, longitude: number}[]} coordinates 
 * @param {d3.Selection} layer - svg to draw in
 * @param {string} cls - class to add (needed to have separate coordinate sets) 
 * @param {number} transitionDuration - msec movement animation should take
 */
function drawCoordinates(coordinates, layer, cls='c', transitionDuration=750) {
  coordinates.forEach((coord) => {
    coord.latlng = new L.LatLng(coord.latitude, coord.longitude);
  });

  const coordinateSelection = layer.selectAll(`circle.coordinate.${cls}`)
    .data(coordinates, d => d.id);

  coordinateSelection.merge(coordinateSelection)
    .transition()
    .duration(transitionDuration)
    .attr('transform', geoTranslate);
  
  coordinateSelection.enter().append('circle')
    .attr('class', `coordinate ${cls}`)
    .attr('transform', geoTranslate);

  coordinateSelection.exit().remove();

  return coordinateSelection;
}

export function drawBikes(stations, transitionDuration=750) {
  drawCoordinates(stations, bikeLayer, 'bike', transitionDuration)
    .style('stroke', 'blue')
    .style('fill', 'blue')
    .attr('r', geoScale(1));
}

export function drawNumBikesStations(stations, maxNumBikes) {
  const color = (d) => d3.rgb(d3.interpolateViridis(d.numBikes / maxNumBikes)).toString();
  drawCoordinates(stations, stationLayer, 'station')
    .attr('r', d => geoScale(2 + 10 * (d.numBikes / maxNumBikes) ** .5))
    .attr('fill', d => rgba(color(d), 0.2))
    .attr('stroke', color);
}

export function drawFlowStations(stations, maxNegativeFlow, maxPositiveFlow) {
  const color = (d) => d3.interpolatePuOr(.5 * Math.sign(d.numBikesDelta) + .5);
  const maxFlow = Math.max(Math.abs(maxNegativeFlow), Math.abs(maxPositiveFlow));
  const stationSelection = drawCoordinates(stations, stationLayer, 'station')
    .attr('r', d => geoScale(2 + 10 * (Math.abs(d.numBikesDelta) / maxFlow) ** .5))
    // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
    // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
    .attr('fill', d => rgba(color(d), 0.2))
    .attr('stroke', color);
  addStationAnimation(stationSelection);
}

function addStationAnimation(stationSelection) {
  stationSelection.on('click', d => { stationLayer.selectAll('line')
    .data(d.targets, d2 => d2.station.id)
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
