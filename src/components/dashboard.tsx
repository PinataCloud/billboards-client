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
import { useState, FormEvent, useRef } from "react"
import { pinata } from "@/lib/pinata"
import { Progress } from "@/components/ui/progress"
import { nanoid } from "nanoid"
import { BoardGrid } from "./board-grid"
import { Link } from "react-router-dom"

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8787"

export function Dashboard() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const [shouldRefetch, setShouldRefetch] = useState(0) // Use number as a counter


  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setProgress(0)

    const formData = new FormData(e.currentTarget)
    const files = formData.getAll('files') as File[]
    const totalFiles = files.length
    const slug = nanoid(7)
    const boardName = formData.get('name') as string
    const uploads: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const urlReq = await fetch(`${SERVER_URL}/presigned_url`)
        const urlRes = await urlReq.json()
        if (!urlReq.ok) {
          console.log("Error", urlRes)
          setIsSubmitting(false)
          return
        }

        const upload = await pinata.upload.public
          .file(file)
          .url(urlRes.url)
          .keyvalues({
            slug: slug,
            fid: "6023",
            boardName: boardName
          })
        console.log(upload)
        uploads.push(`https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${upload.cid}`)

        setProgress(Math.round(((i + 1) / totalFiles) * 100))
      }
      console.log("Form submitted successfully")
      const data = JSON.stringify({
        boardName,
        fid: 6023,
        imageLinks: uploads,
        slug
      })

      const createBoardRequest = await fetch(`${SERVER_URL}/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: data
      })
      console.log(createBoardRequest.status)
      setIsSubmitting(false)
      handleUploadSuccess()
    } catch (error) {
      console.error("Error submitting form:", error)
      setIsSubmitting(false)
    }
  }

  const handleUploadSuccess = () => {
    setShouldRefetch(prev => prev + 1) // Increment to trigger refetch
    setOpen(false) // Close dialog after successful upload
  }



  return (
    <div className="flex flex-col gap-4 w-full items-center justify-start">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className='w-full bg-white flex flex-col items-center py-4 shadow-shadowFull'>
          <Link to="/">
            <h1 className='font-black text-4xl pb-4 text-center py-2'>Billboards</h1>
          </Link>
          <DialogTrigger asChild className="max-w-[300px] w-full">
            <Button>Create</Button>
          </DialogTrigger>
        </div>
        <DialogContent className="sm:max-w-[425px]">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setIsSubmitting(true)
              try {
                await handleSubmit(e)
                handleUploadSuccess()
              } catch (error) {
                console.error(error)
              } finally {
                setIsSubmitting(false)
              }
            }}
            ref={formRef}
            className="flex flex-col gap-4"
          >
            <DialogHeader>
              <DialogTitle>Create a New Board</DialogTitle>
              <DialogDescription>
                Select up to 5 images you want to share
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
                />
                <Input
                  id="files"
                  name="files"
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isSubmitting}
                />
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
              <Button type="submit" disabled={isSubmitting}>
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
