/**
 * @typedef {Object.<number, Bike>} Bikes
 */

/**
 * @typedef Bike
 * @prop {number} id
 * @prop {BikeStop[]} stops
 */

/**
 * @typedef BikeStop
 * @prop {Date} date
 * @prop {Station} station
 */

/**
 * @typedef {Object.<number, Station>} Stations
 */

/**
 * @typedef Station
 * @prop {number} id
 * @prop {number} latitude
 * @prop {number} longitude
 * @prop {BikeCount[]} bikeCounts
 */

/**
 * @typedef BikeCount
 * @prop {Date} date
 * @prop {number} numBikes
 */

/**
 * @typedef GeoCoord
 * @prop {string} id
 * @prop {number} latitude
 * @prop {number} longitude
 * @prop {number} [size]
 */
