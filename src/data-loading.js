import { json as getJSON } from 'd3';

export async function getBlueBikesData() {
  return getJSON('data/data-hourly.json');
}
