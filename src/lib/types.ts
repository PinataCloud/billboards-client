export type BoardDetails = {
  id: number
  fid: number
  name: string
  slug: string
  board_images: {
    id: number
    fid: number
    caption: string | null
    board_id: number
    image_url: string
  }[]
}
