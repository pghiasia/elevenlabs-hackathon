'use client'

import { useState, useRef } from "react"
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
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const color = categoryColors[category as keyof typeof categoryColors]
  const hoverColor = categoryHoverColors[category as keyof typeof categoryHoverColors]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        setIsProcessing(true)

        try {
          // Create FormData to send the audio file
          const formData = new FormData()
          formData.append('file', audioBlob, 'audio.webm')
          formData.append('model', 'whisper-1')

          // Make request to OpenAI API
          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: formData,
          })

          if (!response.ok) {
            throw new Error('Failed to transcribe audio')
          }

          const data = await response.json()
          setFeedback(data.text)
        } catch (error) {
          console.error('Error transcribing audio:', error)
          setFeedback('Error transcribing audio. Please try again.')
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const saveRecording = () => {
    if (!audioURL) return

    const a = document.createElement("a")
    a.href = audioURL
    a.download = `${category}_recording.webm` // Change extension to .mp3 if converted
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
        <Button
          variant="ghost"
          className={`text-${color}-300 hover:text-${color}-100 ${hoverColor}`}
          onClick={saveRecording}
          disabled={!audioURL}
        >
          Save Recording
        </Button>
        <Button variant="ghost" className={`text-${color}-300 hover:text-${color}-100 ${hoverColor}`}>
          Share Feedback
        </Button>
      </CardFooter>
    </Card>
  )
}