import { useEffect, useState } from "react"
import { BoardDetails } from "@/lib/types"
import { Link } from "react-router-dom"
import ImageCard from "./ui/image-card"

type BoardGridProps = {
  refetchTrigger: number
  message: string
  signature: string
  nonce: string
}

const SERVER_URL = "https://billboards-server.pinata-marketing-enterprise.workers.dev"

export function BoardGrid({ refetchTrigger, message, nonce, signature }: BoardGridProps) {
  const [boards, setBoards] = useState<BoardDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBoards() {
      try {
        const response = await fetch(`${SERVER_URL}/list-boards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message,
            nonce,
            signature
          })
        })
        if (!response.ok) {
          throw new Error("Failed to fetch boards")
        }

        const data: BoardDetails[] = await response.json()
        setBoards(data)
      } catch (error) {
        console.error("Error fetching boards:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBoards()
  }, [refetchTrigger, message, nonce, signature])

  if (loading) {
    return <div className="text-center p-4">Loading boards...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {boards.map((board) => (
        <Link key={board.id} to={`/board/${board.slug}`}>
          <ImageCard
            caption={board.name}
            imageUrl={board.board_images[0].image_url}
          ></ImageCard>
        </Link>
      ))}
    </div>
  )
}
