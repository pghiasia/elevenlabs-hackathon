import RecordingInterface from "@/components/RecordingInterface"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function DebateCoach() {
  return (
    <div className="min-h-screen bg-red-900 text-white p-6">
      <Link href="/">
        <Button variant="ghost" className="mb-4 text-red-300 hover:text-red-100 hover:bg-[#800000]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </Link>
      <RecordingInterface category="Debate Coach" />
    </div>
  )
}