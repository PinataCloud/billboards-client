import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BoardDetails } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8787";

export function Board() {
  const { slug } = useParams();
  const [boardData, setBoardData] = useState<BoardDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/board/${slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch board");
        }
        const data = await response.json();
        setBoardData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching board:', error);
        setLoading(false);
      }
    };

    fetchBoard();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!boardData) return <div>Board not found</div>;

  return (
    <div className="min-h-screen w-full flex flex-col gap-6">
      <div className='w-full bg-white flex flex-col items-center py-4 shadow-shadowFull'>
        <Link to="/">
          <h1 className='font-black text-4xl pb-4 text-center py-2'>Billboards</h1>
        </Link>
      </div>
      <div className='max-w-xs mx-auto'>
        <Carousel className='max-w-[400px]'>
          <CarouselContent>
            {boardData.board_images.map((image) => (
              <CarouselItem key={image.id}>
                <Dialog>
                  <DialogTrigger asChild>
                    <Card className='max-w-[350px] cursor-pointer bg-white py-0'>
                      <div className="relative">
                        <img
                          src={image.image_url}
                          alt={image.caption || boardData.name}
                          className="w-full object-cover"
                        />
                        {image.caption && (
                          <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                            {image.caption}
                          </p>
                        )}
                      </div>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                    <img
                      src={image.image_url}
                      alt={image.caption || boardData.name}
                      className="w-full h-full object-contain bg-white"
                    />
                    {image.caption && (
                      <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                        {image.caption}
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <h2 className="text-2xl font-bold mb-6 px-4">{boardData.name}</h2>
      </div>
    </div>
  );
}
