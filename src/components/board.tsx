import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { BoardDetails } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/components/ui/carousel';
import { Button } from './ui/button';
import { FrameSDK } from '@farcaster/frame-sdk/dist/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8787";

export function Board({ sdk }: { sdk: FrameSDK }) {
  const { slug } = useParams();
  const [boardData, setBoardData] = useState<BoardDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

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

  // Track carousel changes to update currentIndex
  useEffect(() => {
    if (!carouselApi) return;

    const onChange = (api: CarouselApi) => {
      if (!api) {
        return
      }
      setCurrentIndex(api.selectedScrollSnap());
    };

    carouselApi.on("select", onChange);

    return () => {
      carouselApi.off("select", onChange);
    };
  }, [carouselApi]);


  async function shareBoard() {
    await sdk.actions.composeCast({
      text: "Check out this fun board!",
      embeds: [`https://billboards.cloud/board/${slug}`]
    })
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  if (!boardData) return <div className="h-screen w-full flex items-center justify-center">Board not found</div>;

  const currentImage = boardData.board_images[currentIndex];

  return (
    <div className="relative h-screen w-full flex flex-col safe-area-inset">
      {/* Header with board title */}
      <div className="bg-white p-3 sm:p-4 shadow-shadowFull flex items-center justify-between px-2">
        <h1 className="text-lg sm:text-xl font-semibold truncate">{boardData.name}</h1>
        <Link to="/">
          <h1 className='font-black text-xl'>Billboards</h1>
        </Link>
      </div>

      {/* Image container - centered carousel */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        <Carousel
          className="h-full w-full flex items-center justify-center"
          setApi={setCarouselApi}
        >
          <CarouselContent className="h-full flex items-center">
            {boardData.board_images.map((image, index) => (
              <CarouselItem key={index} className="h-full flex items-center justify-center">
                <img
                  src={image.image_url}
                  alt={image.caption || `Image ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Image indicators - made slightly larger for mobile */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
            {boardData.board_images.map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full ${index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                aria-label={`Go to image ${index + 1}`}
                onClick={() => carouselApi?.scrollTo(index)}
              />
            ))}
          </div>

        </Carousel>
      </div>

      {/* Caption for current image - only show when a caption exists */}
      {currentImage && currentImage.caption && (
        <div className="bg-white p-3 sm:p-4 shadow-shadowFull flex items-center justify-between">
          <p className="text-sm sm:text-base italic">{currentImage.caption}</p>
          <Button onClick={shareBoard}>Share</Button>
        </div>
      )}
    </div>
  )
}
