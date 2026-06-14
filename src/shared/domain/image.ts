/** An image as returned by `POST /image/list` (only id + url are exposed). */
export interface Image {
  id: string;
  s3Url: string;
}
