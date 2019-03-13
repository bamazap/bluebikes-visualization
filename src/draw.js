import 'leaflet/dist/leaflet.css'; // must be imported before leaflet.js
import * as L from 'leaflet';
//import * as ld from 'leaflet-draw';
import 'leaflet-draw';
import * as d3 from 'd3';

d3.selection.prototype.moveToFront = function() {  
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

const token = 'pk.eyJ1IjoiYmFtYXphcCIsImEiOiJjanQ0amR6dHIxM3YxNDlsbDJxZXFoaTEwIn0.HXt22ulQoeU3Xq1T7fSTRg';

const bounds = [42.4, -72.2, 42.3, -71.0];

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

map.on(L.Draw.Event.CREATED, (e) => {
  const { layer } = e;
  drawnItems.clearLayers();
  drawnItems.addLayer(layer);
  changeAreaCallback(layer.getBounds());
  d3.select('#map svg#viz').moveToFront();
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
const svg = d3.select('#map').select('svg')
  .attr('id', 'viz')
  .attr('pointer-events', 'all')
  .style('position', 'relative');
const voronoiLayer = svg.append("g").attr("class", "voronoi-layer");
const unselectedLayer = svg.append("g").attr("class", "unselected-layer");
const stationLayer = svg.append("g").attr("class", "station-layer");
const tooltipWidth = 100;
const tooltipHeight = 50;
const tooltip = svg.append("foreignObject").attr("class", "tooltip-layer")
  .style("opacity", 0)
  .attr('width', tooltipWidth)
  .attr('height', tooltipHeight);
const tooltipText = tooltip.append('xhtml:p')
  .style('width', '100%')
  .style('height', '100%')
  .style('background', 'lightblue')
  .style('text-align', 'center')
  .attr('font-size', 16);


function geoCoordsToXY(d) {
  return map.latLngToLayerPoint(new L.LatLng(d.latitude, d.longitude));
}

const legendLayer = d3.select("#legend").append("svg").append("g").attr("class", "legend-layer");
var legendSetup = false;

// go from a latlng to pixel coordinates on the map
function geoTranslate(d) {
  const { x, y } = geoCoordsToXY(d);
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
  if (rgb === 'none') return 'none';
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
    legendLayer.selectAll('circle').attr('r', function() {
      return parseFloat(d3.select(this).attr('r')) * scale;
    });
    lastZoom = newZoom;
  }
});

export function setChangeAreaCallback(f) {
  changeAreaCallback = f;
}

/**
 * Draw voronoi map (of polygons containing all space nearest to each point)
 * @param {{ id: string, latitude: number, longitude: number}[]} coordinates 
 */
function drawVoronoi(coordinates) {
  const { x: x1, y: y1 } = map.latLngToLayerPoint(new L.LatLng(bounds[0], bounds[1]));
  const { x: x2, y: y2 } = map.latLngToLayerPoint(new L.LatLng(bounds[2], bounds[3]));
  const voronoiBounds = [[x1, y1], [x2, y2]];

  function draw() {
    const voronoi = d3.voronoi()
      .x(d => geoCoordsToXY(d).x)
      .y(d => geoCoordsToXY(d).y)
      .extent(voronoiBounds);
    const polygons = voronoi.polygons(coordinates);

    return voronoiLayer.selectAll('path.voronoi')
      .data(polygons, d => d && d.data.id)
      .join('path')
      .attr('class', 'voronoi')
      .attr('fill', 'none')
      .attr('stroke', 'none')
      .attr('d', d => d ? 'M' + d.join('L') + 'Z' : null)
      .attr('pointer-events', 'all');
  }

  map.on('zoomend', draw);
  return draw();
}

/**
 * Draw coordinates on the map
 * @param {{ id: string, latitude: number, longitude: number}[]} coordinates 
 * @param {d3.Selection} layer - svg to draw in
 * @param {string} cls - class to add (needed to have separate coordinate sets) 
 */
function drawCoordinates(coordinates, layer, cls='c') {
  return layer.selectAll(`circle.coordinate.${cls}`)
    .data(coordinates, d => d.id)
    .join('circle')
    .attr('class', `coordinate ${cls}`)
    .attr('transform', geoTranslate);
}

/**
 * Draw stations and voronoi layer on the map. Should only be called once. 
 */
export function drawStations(stations) {
  drawVoronoi(stations)
    .on("mouseover", (d) => {
      tooltip
        .attr('transform', geoTranslate(d.data))
        .style("opacity", .9);
      tooltipText.text(d.data.name);
    }, true);
  drawCoordinates(stations, unselectedLayer, 'unselected-center')
    .attr('r', 1)
    .attr('fill', 'black')
    .attr('stroke', 'black');
}

d3.select('#map').on("mouseleave", () => {
  tooltip.style("opacity", 0);
});

export function drawFlowStations(stations, maxNegativeFlow, maxPositiveFlow) {
  const color = (d) => {
    const sign = Math.sign(d.numBikesDelta);
    if (sign > 0) return 'rgb(127, 59, 8)';
    if (sign < 0) return 'rgb(45, 0, 75)';
    return 'none'
  }

  drawCoordinates(stations, stationLayer, 'selected-center')
    .attr('r', 1)
    .attr('fill', color)
    .attr('stroke', color);

  const maxFlow = Math.max(Math.abs(maxNegativeFlow), Math.abs(maxPositiveFlow), 1);
  const stationSel = drawCoordinates(stations, stationLayer, 'halo')
    .attr('r', d => {
      return geoScale(2 + 10 * (Math.abs(d.numBikesDelta) / maxFlow) ** .5);
    })
    // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
    // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
    .attr('fill', d => rgba(color(d), 0.2))
    .attr('stroke', color);
  addStationAnimation(stationSel);
}

function addStationAnimation(stationSelection) {
  stationSelection.on('click', d => { stationLayer.selectAll('line')
    .data(d.rankedTargets, d2 => d2.station.id)
    .join('line')
    .attr("x1", d2 => geoCoordsToXY(d2).x)
    .attr("y1", d2 => geoCoordsToXY(d2).y)
    .attr("x2", geoCoordsToXY(d).x)
    .attr("y2", geoCoordsToXY(d).y)
    .attr('stroke', 'red');
  });
}

export function drawLegend(maxFlow, minFlow) {
  let w, h;
  const xpadding = 20;
  const ypadding = 40;
  if (!legendSetup) {
    w = 300 + 2*xpadding;
    h = calcSize(maxFlow, maxFlow)*4 + 2*ypadding;
    d3.select("#legend").attr("height", h + "px").attr("width", w + "px");
    d3.select("#legend svg").attr("height", h + "px").attr("width", w + "px");
  }

  const cls = "legend-circle";
  // const legendLayer = document.getElementById("legend").append("svg");
  const vals = [maxFlow, Math.round((maxFlow+minFlow)/2), Math.max(minFlow, 1)];

  const legendElts = [];
  const labels = [];
  for (let i = 0; i < 6; i++) {
    let val = vals[i%3];
    let color = () => calcColor(i%2 ? -val : val);
    let row = i % 3;
    let col = i % 2; 
    let x, y;
    if (!legendSetup) { // only place elements the first time you render it
      x = (w-2*xpadding)/5*(1+3*col) - 30; 
      y = (h-2*ypadding)/2*(1+2*row);
    } else {
      x = 0;
      y = 0;
    }
    legendElts.push({id: i, val, color, x, y});
    let text = val + " bikes " + (i%2 ? "arrived" : "departed");
    labels.push({id: i, val, x, y, text});
  }

  legendSetup = true;

  legendLayer.selectAll(`circle.coordinate.legend-background`)
    .data(legendElts, (d) => d.id )
    .join("circle")
    .attr('class', `coordinate legend-background`)
    .attr("transform", function(d) {
      const oldTranslate = d3.select(this).attr('transform');
      return oldTranslate ? oldTranslate : "translate(" + d.x + "," + d.y + ")";
    })
    .attr('r', d => {
      const r = calcSize(d.val, maxFlow);
      return r;
    })
    // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
    // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
    .attr('opacity', 0.7)
    .attr('fill', 'white')
    .attr('stroke', 'white');

  legendLayer.selectAll(`circle.coordinate.legend-center`)
    .data(legendElts, (d) => d.id )
    .join("circle")
    .attr('class', `coordinate legend-center`)
    .attr("transform", function(d) {
      const oldTranslate = d3.select(this).attr('transform');
      return oldTranslate ? oldTranslate : "translate(" + d.x + "," + d.y + ")";
    })
    .attr('r', 1)
    // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
    // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
    .attr('fill', d => d.color(d.val))
    .attr('stroke', d => d.color(d.val));

  legendLayer.selectAll(`circle.coordinate.${cls}`)
    .data(legendElts, (d) => d.id )
    .join("circle")
    .attr('class', `coordinate ${cls}`)
    .attr("transform", function(d) {
      const oldTranslate = d3.select(this).attr('transform');
      return oldTranslate ? oldTranslate : "translate(" + d.x + "," + d.y + ")";
    })
    .attr('r', d => {
      const r = calcSize(d.val, maxFlow);
      return r;
    })
    // .attr('r', d => 2 + 10 * (Math.max(d.numBikesDelta, 0) / maxFlow) ** .5) // positive
    // .attr('r', d => 2 + 10 * (Math.max(-1 * d.numBikesDelta, 0) / maxFlow) ** .5) // negative
    .attr('fill', d => rgba(d.color(d.val), 0.2))
    .attr('stroke', d => d.color(d.val));

  legendLayer.selectAll("text")
    .data(labels, (d) => d.id)
    .join("text")
    .attr("transform", function(d) {
      const oldTranslate = d3.select(this).attr('transform');
      return oldTranslate ? oldTranslate : "translate(" + (d.x + 15) + "," + (d.y + 5) + ")";
    })
    .text((d) => d.text);
}
