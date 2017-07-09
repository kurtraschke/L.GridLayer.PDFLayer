import L from "Leaflet";
import { PDFJS } from "PDFJS-dist";

const rescaleCanvas = ctx => {
  const devicePixelRatio = window.devicePixelRatio || 1;

  if (devicePixelRatio !== 1) {
    const oldWidth = ctx.canvas.width;
    const oldHeight = ctx.canvas.height;

    ctx.canvas.width = oldWidth * devicePixelRatio;
    ctx.canvas.height = oldHeight * devicePixelRatio;

    ctx.canvas.style.width = `${oldWidth}px`;
    ctx.canvas.style.height = `${oldHeight}px`;

    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
};

const computeScale = (page, map, layerBounds, zoom) => {
  const viewport = page.getViewport(1.0);

  const [pageMinX, pageMinY, pageMaxX, pageMaxY] = [
    0,
    0,
    viewport.width,
    viewport.height
  ];

  const sw = map.project(layerBounds.getSouthWest(), zoom);
  const ne = map.project(layerBounds.getNorthEast(), zoom);

  const [layerMinX, layerMinY, layerMaxX, layerMaxY] = [sw.x, sw.y, ne.x, ne.y];

  const xScale =
    Math.abs(layerMaxX - layerMinX) / Math.abs(pageMaxX - pageMinX);
  const yScale =
    Math.abs(layerMaxY - layerMinY) / Math.abs(pageMaxY - pageMinY);
  const scale = Math.min(xScale, yScale);

  return scale;
};

const parent = tile => {
  const x = Math.floor(tile.x / 2);
  const y = Math.floor(tile.y / 2);
  const z = tile.z - 1;
  const parentTile = new L.Point(x, y);
  parentTile.z = z;
  return parentTile;
};

const children = tile => {
  const children = [];
  for (let i = 2 * tile.x; i < 2 * tile.x + 2; i++) {
    for (let j = 2 * tile.y; j < 2 * tile.y + 2; j++) {
      const childTile = new L.Point(i, j);
      childTile.z = tile.z + 1;
      children.push(childTile);
    }
  }
  return children;
};

const PDFLayer = L.GridLayer.extend({
  _metatileCanvases: {},
  _getMetatileCanvas(key) {
    if (!this._metatileCanvases[key]) {
      const p = this._pagePromise.then(page => {
        const mtBounds = L.latLngBounds(
          Array.prototype.concat
            .apply(
              [],
              children(this._keyToTileCoords(key)).map(tile => children(tile))
            )
            .map(tile => this._tileCoordsToBounds(tile))
        );

        const zoom = this._keyToTileCoords(key).z + 2;

        const layerBoundsTopLeft = this._map.project(
          this.options.bounds.getNorthWest(),
          zoom
        );
        const tileTopLeft = this._map.project(mtBounds.getNorthWest(), zoom);
        const tileBottomRight = this._map.project(
          mtBounds.getSouthEast(),
          zoom
        );

        const canvas = L.DomUtil.create("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = tileBottomRight.x - tileTopLeft.x;
        canvas.height = tileBottomRight.y - tileTopLeft.y;

        rescaleCanvas(ctx);

        return page
          .render({
            intent: "print",
            background: "transparent",
            canvasContext: ctx,
            viewport: new PDFJS.PageViewport(
              page.view,
              computeScale(page, this._map, this.options.bounds, zoom),
              page.rotation,
              -1 * (tileTopLeft.x - layerBoundsTopLeft.x),
              -1 * (tileTopLeft.y - layerBoundsTopLeft.y)
            )
          })
          .then(() => canvas);
      });
      this._metatileCanvases[key] = p;
    }

    return this._metatileCanvases[key];
  },
  createTile(coords, done) {
    const layerBounds = this.options.bounds;
    const tile = L.DomUtil.create("canvas", "leaflet-tile");
    const size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;
    const ctx = tile.getContext("2d");

    rescaleCanvas(ctx);

    const tileBounds = this._tileCoordsToBounds(coords);

    const zoom = coords.z;

    this._pagePromise.then(page => {
      this._getMetatileCanvas(
        this._tileCoordsToKey(parent(parent(coords)))
      ).then(
        metatileCanvas => {
          ctx.drawImage(
            metatileCanvas,
            coords.x % 4 * tile.width,
            coords.y % 4 * tile.height,
            tile.width,
            tile.height,
            0,
            0,
            size.x,
            size.y
          );
          done(null, tile);
        },
        error => {
          console.error(error);
          done(error);
        }
      );
    });
    return tile;
  }
});

PDFLayer.addInitHook(function() {
  const pdf = this.options.pdf;
  const page = this.options.page;
  this._documentPromise = PDFJS.getDocument(pdf);
  this._pagePromise = this._documentPromise.then(pdf => pdf.getPage(page));
});

export default PDFLayer;
