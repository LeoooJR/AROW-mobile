declare module "*.css";

declare module "*.geojson" {
  const assetId: number;
  export default assetId;
}

declare module "*.sqlite" {
  const assetId: number;
  export default assetId;
}
