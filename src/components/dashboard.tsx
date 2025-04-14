import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, FormEvent, useRef, useEffect } from "react"
import { pinata } from "@/lib/pinata"
import { Progress } from "@/components/ui/progress"
import { nanoid } from "nanoid"
import { BoardGrid } from "./board-grid"
import { Link } from "react-router-dom"
import { X } from "lucide-react" // Import an icon for the remove button
import { useAuth } from "@/hooks/useAuth"

const SERVER_URL = import.meta.env.VITE_SERVER_URL

// Define a type for files with captions
type FileWithCaption = {
  file: File;
  caption: string;
  preview?: string;
};

export function Dashboard() {
  const { isAuthenticated, isAuthenticating, nonce, message, signature, fid, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<FileWithCaption[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shouldRefetch, setShouldRefetch] = useState(0)

  // Add a file to the selected files list
  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        caption: "",
        preview: URL.createObjectURL(file)
      }));

      setSelectedFiles(prev => [...prev, ...newFiles]);

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Update caption for a specific file
  const updateCaption = (index: number, caption: string) => {
    setSelectedFiles(prev =>
      prev.map((item, i) => i === index ? { ...item, caption } : item)
    );
  };

  // Remove a file from the selected list
  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      // Revoke the object URL to avoid memory leaks
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setProgress(0);

    const formData = new FormData(e.currentTarget);
    const boardName = formData.get('name') as string;
    const slug = nanoid(7);
    const totalFiles = selectedFiles.length;

    // Track uploads with their URLs
    const uploadedImages: string[] = [];
    // Track captions in the same order as images
    const imageCaptions: string[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const { file, caption } = selectedFiles[i];
        const urlBody = JSON.stringify({
          nonce,
          message,
          signature
        })
        const urlReq = await fetch(`${SERVER_URL}/presigned_url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: urlBody
        });
        const urlRes = await urlReq.json();
        if (!urlReq.ok) {
          console.log("Error", urlRes);
          setIsSubmitting(false);
          return;
        }

        const upload = await pinata.upload.public
          .file(file)
          .url(urlRes.url)
          .keyvalues({
            slug: slug,
            fid: fid?.toString() || "",
            boardName: boardName,
            caption: caption // Include caption in metadata
          });

        // Store the image URL
        const imageUrl = `https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${upload.cid}`;
        uploadedImages.push(imageUrl);
        // Store the caption in the same order
        imageCaptions.push(caption);

        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      // Create the request body with both images and captions
      const data = JSON.stringify({
        boardName,
        imageLinks: uploadedImages,
        captions: imageCaptions, // Send captions array in same order as imageLinks
        slug,
        nonce,
        message,
        signature
      });

      const createBoardRequest = await fetch(`${SERVER_URL}/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: data
      });

      if (!createBoardRequest.ok) {
        const errorData = await createBoardRequest.json();
        throw new Error(errorData.error || "Failed to create board");
      }

      setIsSubmitting(false);
      handleUploadSuccess();
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  }
  const handleUploadSuccess = () => {
    setShouldRefetch(prev => prev + 1);
    setOpen(false);
    setSelectedFiles([]); // Clear files on success
  };

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [selectedFiles]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
        <div className="bg-white p-8 rounded-lg shadow-shadowFull max-w-sm w-full text-center">
          <Link to="/">
            <h1 className='font-black text-4xl pb-6 text-center'>Billboards</h1>
          </Link>
          <p className="mb-6 text-gray-600">Sign in with your Farcaster account to view and create boards</p>
          <Button
            onClick={signIn}
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full items-center justify-start pb-6">
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Clear selected files when dialog closes
          setSelectedFiles([]);
        }
        setOpen(newOpen);
      }}>
        <div className='w-full bg-white flex flex-col items-center py-4 shadow-shadowFull'>
          <Link to="/">
            <h1 className='font-black text-4xl pb-4 text-center py-2'>Billboards</h1>
          </Link>
          <div className="flex items-center gap-4 max-w-[300px] w-full">
            <DialogTrigger asChild className="flex-1">
              <Button>Create</Button>
            </DialogTrigger>
            <Button variant="neutral" onClick={signOut}>Sign Out</Button>
          </div>
        </div>
        <DialogContent className="sm:max-w-[500px] min-h-[600px]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>Create a New Board</DialogTitle>
              <DialogDescription>
                Add images with captions for your new board
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Board Name"
                  disabled={isSubmitting}
                  required
                />

                {/* File input for selecting images */}
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*"
                    disabled={isSubmitting}
                    ref={fileInputRef}
                    onChange={handleFileAdd}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    Add Image
                  </Button>
                </div>

                {/* Selected files preview with captions */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-4 max-h-[320px] overflow-y-auto p-2 border rounded-md">
                    <h3 className="font-medium">Selected Images ({selectedFiles.length})</h3>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 border rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="truncate max-w-[200px]">{file.file.name}</span>
                          <Button
                            variant="neutral"
                            size="sm"
                            type="button"
                            onClick={() => removeFile(index)}
                            disabled={isSubmitting}
                            className="h-7 w-7 p-0"
                          >
                            <X size={16} />
                          </Button>
                        </div>

                        {file.preview && (
                          <img
                            src={file.preview}
                            alt="Preview"
                            className="h-24 object-contain mx-auto"
                          />
                        )}

                        <Input
                          placeholder="Add a caption for this image"
                          value={file.caption}
                          onChange={(e) => updateCaption(index, e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {isSubmitting && (
                  <div className="mt-2">
                    <Progress value={progress} className="mb-1" />
                    <div className="text-xs text-center">{progress}% complete</div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="neutral" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting || selectedFiles.length === 0}
              >
                {isSubmitting ? "Uploading..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <BoardGrid refetchTrigger={shouldRefetch} />
    </div>
  )
}
