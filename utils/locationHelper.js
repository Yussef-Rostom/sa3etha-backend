const fs = require("fs");
const path = require("path");

const geojsonPath = path.join(__dirname, "..", "gadm41_EGY_1.json");
const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));

function pointInPolygon(point, polygon) {
  let x = point[0],
    y = point[1];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i][0],
      yi = polygon[i][1];
    let xj = polygon[j][0],
      yj = polygon[j][1];
    let intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function getGovernorate(lon, lat) {
  for (const feature of geojson.features) {
    const geometry = feature.geometry;
    if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates) {
        if (pointInPolygon([lon, lat], polygon[0])) {
          return feature.properties.NAME_1;
        }
      }
    } else if (geometry.type === "Polygon") {
      if (pointInPolygon([lon, lat], geometry.coordinates[0])) {
        return feature.properties.NAME_1;
      }
    }
  }
  return null;
}

module.exports = { getGovernorate };
