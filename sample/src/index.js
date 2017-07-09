import L from "Leaflet";
import { PDFJS } from "PDFJS-dist";
import PDFLayer from "../../src/PDFLayer";

PDFJS.workerSrc = "dist/worker.js";

const map = L.map("map", {
  minZoom: 4,
  maxZoom: 16
});

map.setView([40.697632, -98.461165], 4);

L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

new PDFLayer({
  pdf: "cb17-100-median-age.pdf",
  page: 1,
  minZoom: map.getMinZoom(),
  maxZoom: map.getMaxZoom(),
  bounds: new L.LatLngBounds([-0.308849, -123.453116], [49.923578, -57.619317]),
  attribution:
    '<a href="https://census.gov/newsroom/press-releases/2017/cb17-100.html">U.S. Census Bureau</a>'
}).addTo(map);
