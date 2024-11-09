'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, StopCircle, Loader2 } from "lucide-react"

const categoryColors = {
  "Debate Coach": "red",
  "Interview Prep": "blue",
  "Presentation": "purple",
}

const categoryHoverColors = {
  "Debate Coach": "hover:bg-[#800000]",
  "Interview Prep": "hover:bg-[#002b80]",
  "Presentation": "hover:bg-[#3f0080]",
}

export default function RecordingInterface({ category }: { category: string }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedback, setFeedback] = useState("")
  const color = categoryColors[category as keyof typeof categoryColors]
  const hoverColor = categoryHoverColors[category as keyof typeof categoryHoverColors]

  const startRecording = () => {
    setIsRecording(true)
    // Implement actual recording logic here
  }

  const stopRecording = () => {
    setIsRecording(false)
    setIsProcessing(true)
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      setFeedback("Great job! Here's some feedback on your speech...")
    }, 3000)
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto bg-${color}-900 border-${color}-700`}>
      <CardHeader>
        <CardTitle className={`text-2xl text-${color}-100`}>{category}</CardTitle>
        <CardDescription className={`text-${color}-300`}>Record your speech for AI feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive" size="lg" className="w-32 h-32 rounded-full">
              <StopCircle className="h-16 w-16" />
            </Button>
          ) : (
            <Button onClick={startRecording} variant="outline" size="lg" className={`w-32 h-32 rounded-full bg-${color}-700 hover:bg-${color}-600`}>
              <Mic className="h-16 w-16" />
            </Button>
          )}
        </div>
        {isProcessing && (
          <div className={`text-center text-${color}-300`}>
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2">Processing your speech...</p>
          </div>
        )}
        {feedback && (
          <div className={`bg-${color}-800 p-4 rounded-lg`}>
            <h3 className={`text-lg font-semibold mb-2 text-${color}-100`}>AI Feedback</h3>
            <p className={`text-${color}-300`}>{feedback}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="ghost" className={`text-${color}-300 hover:text-${color}-100 ${hoverColor}`}>
          Save Recording
        </Button>
        <Button variant="ghost" className={`text-${color}-300 hover:text-${color}-100 ${hoverColor}`}>
          Share Feedback
        </Button>
      </CardFooter>
    </Card>
  )
}