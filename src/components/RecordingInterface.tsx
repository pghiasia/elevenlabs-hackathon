'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, StopCircle, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'

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
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [analysis, setAnalysis] = useState("")
  const [improvedVersion, setImprovedVersion] = useState("")

  const color = categoryColors[category as keyof typeof categoryColors]
  const hoverColor = categoryHoverColors[category as keyof typeof categoryHoverColors]

  const startRecording = async () => {
    try {
      // Clear previous feedback and audio URL
      setAnalysis("")
      setImprovedVersion("")
      setAudioURL(null)
      
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
          // First API call - Transcribe audio
          const formData = new FormData()
          formData.append('file', audioBlob, 'audio.webm')
          formData.append('model', 'whisper-1')

          const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: formData,
          })

          if (!transcriptionResponse.ok) throw new Error('Failed to transcribe audio')
          const transcriptionData = await transcriptionResponse.json()
          const transcribedText = transcriptionData.text

          // Second API call - Get analysis feedback
          const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional ${category} coach. Analyze the following speech and provide 4-5 key points of constructive feedback. Be direct and concise (max 3 lines per point). ALWAYS format as a list of markdown bullet points using * for each point.`
                },
                {
                  role: 'user',
                  content: transcribedText
                }
              ],
              temperature: 0.1,
              stream: true,
            }),
          })

          if (!analysisResponse.ok) throw new Error('Failed to get analysis')

          // Third API call - Get improved version
          const improvedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `You are a professional ${category} coach. Rewrite the following speech in a more polished and professional manner. Provide only the improved version, no explanations. Be concise but remain engaging. Maintain similar length if possible.`
                },
                {
                  role: 'user',
                  content: transcribedText
                }
              ],
              temperature: 0.1,
              stream: true,
            }),
          })

          if (!improvedResponse.ok) throw new Error('Failed to get improved version')

          // Handle analysis stream
          const analysisReader = analysisResponse.body?.getReader()
          const analysisDecoder = new TextDecoder()

          while (analysisReader) {
            const { value, done } = await analysisReader.read()
            if (done) break

            const chunk = analysisDecoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (!line.startsWith('data:')) continue
              if (line.includes('[DONE]')) continue
              
              try {
                const json = JSON.parse(line.replace('data: ', ''))
                const content = json.choices[0].delta.content || ''
                setAnalysis(prev => prev + content)
              } catch (e) {
                console.error('Error parsing analysis stream:', e)
              }
            }
          }

          // Handle improved version stream
          const improvedReader = improvedResponse.body?.getReader()
          const improvedDecoder = new TextDecoder()

          while (improvedReader) {
            const { value, done } = await improvedReader.read()
            if (done) break

            const chunk = improvedDecoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (!line.startsWith('data:')) continue
              if (line.includes('[DONE]')) continue
              
              try {
                const json = JSON.parse(line.replace('data: ', ''))
                const content = json.choices[0].delta.content || ''
                setImprovedVersion(prev => prev + content)
              } catch (e) {
                console.error('Error parsing improved version stream:', e)
              }
            }
          }

        } catch (error) {
          console.error('Error processing audio:', error)
          setAnalysis('Error processing audio. Please try again.')
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
        <CardDescription className={`text-${color}-300`}>Record your speech for AI feedback and an improved version that captures the same idea.</CardDescription>
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
        {audioURL && (
          <div className={`bg-${color}-800 p-4 rounded-lg space-y-4`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold mb-2 text-${color}-100`}>Thank you for your speech! Here's your feedback: </h3>
            </div>
            
            {isProcessing && (
              <div className={`text-center text-${color}-300`}>
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2">Processing your speech...</p>
              </div>
            )}
            
            {analysis && (
              <div className="mb-4">
                <h4 className={`text-md font-semibold mb-2 text-${color}-100`}>Analysis & Feedback</h4>
                <ul className={`text-${color}-300 space-y-2 list-disc pl-4`}>
                  {analysis.split('\n')
                    .map(point => point.trim())
                    .filter(point => point.length > 0)
                    .map((point, index) => (
                      <li key={index}>{point.replace(/^[*-]\s*/, '')}</li>
                    ))}
                </ul>
              </div>
            )}
            
            {improvedVersion && (
              <div>
                <h4 className={`text-md font-semibold mb-2 text-${color}-100`}>Improved Version</h4>
                <ReactMarkdown className={`text-${color}-300 whitespace-pre-wrap`}>{improvedVersion}</ReactMarkdown>
              </div>
            )}
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