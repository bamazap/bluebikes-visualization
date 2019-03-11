import * as d3 from 'd3';

/**
 * Draw a GeoJSON map
 * @param {*} geojson GEOJson data to draw
 * @param {d3.Selection} svg - svg container to draw in
 * @return {d3.GeoPath} projection function so you can draw on top of it
 */
export function drawMap(geojson, svg) {
  const scalingFactor = 2;
  const width = 700*scalingFactor;
  const height = 680*scalingFactor;

  svg.attr('width', width).attr('height', height);

  // Append empty placeholder g element to the SVG
  // g will contain geometry elements
  const g = svg.append('g');

  // Width and Height of the whole visualization
  // Set Projection Parameters
  const albersProjection = d3.geoAlbers()
    .scale(190000*scalingFactor)
    //.scale(300000)
    .rotate([71.057, 0])
    .center([0, 42.313])
    .translate([width / 2, height / 2]);

  // Create GeoPath function that uses built-in D3 functionality to turn
  // lat/lon coordinates into screen coordinates
  const geoPath = d3.geoPath()
    .projection(albersProjection);

  g.selectAll('path')
    .data(geojson.features)
    .enter()
    .append('path')
    .attr('fill', 'darkgray')
    .attr('stroke', 'darkgray')
    .attr('d', geoPath);

  return albersProjection;
}

/**
 * Draws points on the map
 * @param {GeoCoord[]} points - points to draw
 * @param {d3.GeoPath} projection - projection function used to draw the map
 * @param {d3.Selection} svg - svg container to draw in
 */
export function drawBikes(points, projection, svg, transitionDuration) {
  let circles = svg.selectAll('circle.bike')
    .data(points, d => d.id);

  const move = (sel) => sel.attr(
      'transform',
      d => `translate(${projection([d.longitude, d.latitude])})`,
    );

  move(circles.merge(circles).transition()
    .duration(transitionDuration));


  move(circles = circles.enter().append('circle')
    .attr('class', 'bike')
    .attr('r', 1)
    .attr('fill', 'rgb(173,216,230, .5)')); // a low-opacity lightblue
    
  circles.exit().remove()
}

/**
 * Draws points on the map
 * @param {GeoCoord[]} points - points to draw
 * @param {d3.GeoPath} projection - projection function used to draw the map
 * @param {d3.Selection} svg - svg container to draw in
 * @param {number} transitionDuration in msec
 * @param {number} maxNumBikes max size of any point ever
 */
export function drawNumBikesStations(points, projection, svg, transitionDuration, maxNumBikes) {
  svg.selectAll('circle.station')
    .data(points, d => d.id)
    .join('circle')
    .attr('class', 'station')
    .attr(
      'transform',
      d => `translate(${projection([d.longitude, d.latitude])})`,
    )
    .transition()
    .duration(transitionDuration)
    .attr('r', d => 2 + 5 * (d.numBikes / maxNumBikes) ** .5)
    .attr('fill', d => d3.interpolateViridis(d.numBikes / maxNumBikes));
}

/**
 * Draws points on the map
 * @param {GeoCoord[]} points - points to draw
 * @param {d3.GeoPath} projection - projection function used to draw the map
 * @param {d3.Selection} svg - svg container to draw in
 * @param {number} transitionDuration in msec
 * @param {number} maxFlow max flow of any point ever
 */
export function drawFlowStations(
  points,
  projection,
  svg,
  transitionDuration,
  maxNegativeFlow,
  maxPositiveFlow
) {
  const maxFlow = Math.max(Math.abs(maxNegativeFlow), Math.abs(maxPositiveFlow));
  svg.selectAll('circle.station')
    .data(points, d => d.id)
    .join('circle')
    .attr('class', 'station')
    .attr(
      'transform',
      d => `translate(${projection([d.longitude, d.latitude])})`,
    )
    .transition()
    .duration(transitionDuration)
    .attr('r', d => 2 + 5 * (Math.abs(d.flow) / maxFlow) ** .5)
    .attr('fill', d => d3.interpolatePuOr(.5 * d.flow / maxFlow + .5));
}
