import RecordingInterface from "@/components/RecordingInterface"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function Presentation() {
  return (
    <div className="min-h-screen bg-purple-900 text-white p-6">
      <Link href="/">
        <Button variant="ghost" className="mb-4 text-purple-300 hover:text-purple-100 hover:bg-[#3f0080]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </Link>
      <RecordingInterface category="Presentation" />
    </div>
  )
}