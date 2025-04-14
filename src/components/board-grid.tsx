import { useEffect, useState } from "react"
import { BoardDetails } from "@/lib/types"
import { Link } from "react-router-dom"
import ImageCard from "./ui/image-card"
import { useAuth } from "@/hooks/useAuth"

type BoardGridProps = {
  refetchTrigger: number
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL

export function BoardGrid({ refetchTrigger }: BoardGridProps) {
  const { nonce, message, signature, isAuthenticated } = useAuth();
  const [boards, setBoards] = useState<BoardDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBoards() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

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
  }, [refetchTrigger, message, nonce, signature, isAuthenticated])

  if (loading) {
    return <div className="text-center p-4">Loading boards...</div>
  }

  if (boards.length === 0) {
    return (
      <div className="text-center p-4 mt-8">
        <p className="text-gray-600 mb-4">You haven't created any boards yet.</p>
      </div>
    );
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
