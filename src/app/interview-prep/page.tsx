import RecordingInterface from "@/components/RecordingInterface"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function InterviewPrep() {
  return (
    <div className="min-h-screen bg-blue-900 text-white p-6">
      <Link href="/">
        <Button variant="ghost" className="mb-4 text-blue-300 hover:text-blue-100 hover:bg-[#002b80]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </Link>
      <RecordingInterface category="Interview Prep" />
    </div>
  )
}