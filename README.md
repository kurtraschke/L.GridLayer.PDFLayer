L.GridLayer.PDFLayer
====================

**A [Leaflet](http://leafletjs.com/) layer for rendering PDF documents with [PDF.js](https://mozilla.github.io/pdf.js/).**

Introduction
------------

This is `L.GridLayer.PDFLayer`, a Leaflet layer which renders PDF documents on a Leaflet map using PDF.js.  It can be used to render a geographic map in a PDF as an overlay, or, with [`L.CRS.Simple`](http://leafletjs.com/examples/crs-simple/crs-simple.html), to turn Leaflet into a generic viewer for non-geographic PDF documents.

Implementation
--------------

`L.GridLayer.PDFLayer` uses PDF.js to render on an `L.GridLayer` of `<canvas>` elements.  Because PDF.js does not support partial rendering (i.e. it renders the entire document for each render operation, regardless of the size of the target canvas or the requested offset), we render to 4x4 metatiles, then extract the relevant portions with `CanvasRenderingContext2D.drawImage()`.  The `bounds` parameter is used to fit and place the PDF page on the map, meaning that (assuming suitably compatible projections), a PDF map can be precisely overlaid on other content in a Leaflet map and treated like any other Leaflet layer.

### Alternatives

The metatile-based scheme is a bit ungainly—when PDF.js supports partial rendering ([#6419](https://github.com/mozilla/pdf.js/issues/6419)), then we can render directly to map tiles, without incurring the performance hit that would entail now.

Alternatively, there is new support in PDF.js for [rendering to SVG](https://github.com/mozilla/pdf.js/tree/master/examples/svgviewer).  The resulting SVG could then be fed into a slicer, akin to an SVG version of [geojson-vt](https://github.com/mapbox/geojson-vt), and rendered on an `L.GridLayer` of `<svg>` elements instead.

Use
---

`L.GridLayer.PDFLayer` is implemented as an ES6 module; the included demonstration uses Babel and Browserify, but other similar toolchains will probably work.
