/**
 * @typedef TLL
 * Time + Latitude + Longitude
 * @prop {Date} time
 * @prop {number} latitude
 * @prop {number} longitude
 */

/**
 * Get the Blue Bike data
 * @return {Promise<{ [id: number]: TLL[] }>}
 * TODO: more than one day of data
 *    need to break up CSV files by day or something
 */
async function getData() {
  // read the CSV
  // TODO: preprocess as JSON
  let data = await d3.csv('/data/20190201-bluebikes-tripdata.csv');
  data = data.map((datum) => ({
    bikeID: parseInt(datum.bikeid, 10),
    startLatitude: parseFloat(datum['start station latitude']),
    startLongitude: parseFloat(datum['start station longitude']),
    startTime: new Date(datum.starttime),
    endLatitude: parseFloat(datum['end station latitude']),
    endLongitude: parseFloat(datum['end station longitude']),
    endTime: new Date(datum.stoptime),
  }));

  // construct a list of timed coordinates for each bike ID
  const dataByID = {};
  data.forEach((datum) => {
    if (!(datum.bikeID in dataByID)) {
      dataByID[datum.bikeID] = [];
    }
    const records = dataByID[datum.bikeID];
    ['start', 'end'].forEach((s) => {
      const latitude = datum[s+'Latitude'];
      const longitude = datum[s+'Longitude'];
      const time = datum[s+'Time'];
      // skip points which are the same location as the previous
      if (records.length > 0) {
        const lastRecord = records[records.length-1];
        if (
          lastRecord.latitude === latitude
          && lastRecord.longitude === longitude
        ) {
          return; // continue
        }
      }
      records.push({ time, latitude, longitude });
    });
  });
  // reverse the lists (makes things easier below)
  Object.values(dataByID).forEach(a => a.reverse());
  return dataByID;
}

/**
 * @param {{ [id: number]: TLL[] }} dataByID (records are latest first)
 * @param {Date} time
 * @return {{TLL & { id: number }}[]} earliest record after given time
 */
function dataForTime(dataByID, time) {
  return Object.entries(dataByID).map(([id, timedCoords]) => {
    // assumes timedCoords is latest first
    let tll = timedCoords.find(({ time: coordTime }) => coordTime < time);
    tll = tll || timedCoords[timedCoords.length - 1]; // default to first position
    return tll && { id, ...tll };
  }).filter((d) => !!d);
}

/**
 * Draw a GeoJSON map
 * @param {object} geojson GEOJson data to draw
 * @param {D3.Element} svg - svg container to draw in
 * @return {D3.Projection} projection function so you can draw on top of it
 */
function drawMap(geojson, svg) {
  const width = parseInt(svg.style('width'));
  const height = parseInt(svg.style('height'));

  // Append empty placeholder g element to the SVG
  // g will contain geometry elements
  const g = svg.append( 'g' );

  // Width and Height of the whole visualization
  // Set Projection Parameters
  const albersProjection = d3.geoAlbers()
    .scale(190000)
    .rotate([71.057,0])
    .center([0, 42.313])
    .translate([width/2,height/2]);

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

  return albersProjection
}

/**
 * @param {{ latitude: number, longitude: number }[]} points
 * @param {D3.Projection} projection 
 * @param {D3.Element} svg 
 */
function drawGeoCoords(points, projection, svg) {
  svg.selectAll('circle')
    .data(points, (d) => d.id)
    .join('circle')
    .transition()
    .attr('r', 1)
    .attr('transform', (d) => 'translate('
      + projection([d.longitude, d.latitude])
      + ')'
    )
    .attr('fill', 'lightblue');
}

async function main() {
  const svg = d3.select('body')
    .append('svg')
    .attr('width', 700)
    .attr('height', 680);
  
  const mapJSON = await d3.json('data/Boston_Neighborhoods.geojson');
  const projection = drawMap(mapJSON, svg);
  const bbData = await getData();

  // for now, only show so many bikes
  // TODO: figure out how to make N bikes per station meaningful
  Object.keys(bbData).sort((a, b) => a - b).slice(50).forEach(id => {
    delete bbData[id];
  });

  function drawAtTime(t, maxt) {
    const points = dataForTime(bbData, t);
    drawGeoCoords(points, projection, svg);
    t = new Date(t.getTime() + 60 * 60 * 1000); // plus one hour
    if (t < maxt) {
      setTimeout(() => drawAtTime(t, maxt), 500);
    }
  }
  const t = new Date('2019-02-01 00:00:00');
  const maxt = new Date('2019-02-02 00:00:00');
  drawAtTime(t, maxt);
}

main();
