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
 * @param {IDStop[]} points - points to draw
 * @param {d3.GeoPath} projection - projection function used to draw the map
 * @param {d3.Selection} svg - svg container to draw in
 */
export function drawGeoCoords(points, projection, svg) {
  svg.selectAll('circle')
    .data(points, d => d.id)
    .join('circle')
    .transition()
    .attr('r', 1)
    .attr(
      'transform',
      d => `translate(${projection([d.longitude, d.latitude])})`,
    )
    .attr('fill', 'lightblue');
}

export function drawSizedGeoCoords(points, projection, svg) {
  svg.selectAll('circle')
    .data(points, d => d.id)
    .join('circle')
    .transition()
    .attr('r', d => (d.size ** .5) / 2)
    .attr(
      'transform',
      d => `translate(${projection([d.longitude, d.latitude])})`,
    )
    .attr('fill', 'lightblue');
}
