'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, StopCircle, Loader2, Upload } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { createAudioStreamFromText } from "./text_to_speech"

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
  const [transcribedText, setTranscribedText] = useState<string | null>(null)
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          setTranscribedText(transcribedText)

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
                  content: `You are a professional ${category} coach. Analyze the following speech and provide 4-5 of the best key points of constructive feedback. Be direct and concise (max 3 lines per point). ALWAYS format as a list of markdown bullet points using * for each point.`
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

  const generateVoice = async () => {
    if (!improvedVersion) return
    
    try {
      setIsGeneratingVoice(true)
      const audioStream = await createAudioStreamFromText(improvedVersion)
      if (!audioStream) throw new Error('No audio stream returned')
      
      // Create a Blob from the audio stream before creating URL
      const audioBlob = new Blob([audioStream], { type: 'audio/mpeg' })
      const audio = new Audio()
      audio.src = URL.createObjectURL(audioBlob)
      await audio.play()
    } catch (error) {
      console.error('Error generating voice:', error)
      // Optionally add toast/alert to notify user
    } finally {
      setIsGeneratingVoice(false)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      setAnalysis("")
      setImprovedVersion("")
      setAudioURL(null)
      setTranscribedText(null)
      
      // Create URL for the uploaded file
      const url = URL.createObjectURL(file)
      setAudioURL(url)
      setIsProcessing(true)

      // Process the uploaded file similar to recorded audio
      const formData = new FormData()
      formData.append('file', file)
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
      setTranscribedText(transcribedText)

      // Get analysis feedback
      const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a professional ${category} coach. Analyze the following speech and provide 4-5 of the best key points of constructive feedback. Be direct and concise (max 3 lines per point). ALWAYS format as a list of markdown bullet points using * for each point.`
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

      // Get improved version
      const improvedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
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
      console.error('Error processing uploaded file:', error)
      setAnalysis('Error processing audio file. Please try again.')
    } finally {
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto bg-${color}-900 border-${color}-700`}>
      <CardHeader>
        <CardTitle className={`text-2xl text-${color}-100`}>{category}</CardTitle>
        <CardDescription className={`text-${color}-300`}>
          Record your speech or upload an audio file (mp3, wav, webm, etc.) for AI feedback and an improved version that captures the same idea.
          <br />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center gap-4">
          {isRecording ? (
            <Button onClick={stopRecording} variant="destructive" size="lg" className="w-32 h-32 rounded-full">
              <StopCircle className="h-16 w-16" />
            </Button>
          ) : (
            <Button onClick={startRecording} variant="outline" size="lg" className={`w-32 h-32 rounded-full bg-${color}-700 hover:bg-${color}-600`}>
              <Mic className="h-16 w-16" />
            </Button>
          )}

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
              disabled={isRecording || isUploading}
            />
            <Button
              variant="outline"
              size="lg"
              className={`w-32 h-32 rounded-full bg-${color}-700 hover:bg-${color}-600`}
              onClick={handleUploadClick}
              disabled={isRecording || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-16 w-16 animate-spin" />
              ) : (
                <Upload className="h-16 w-16" />
              )}
            </Button>
          </div>
        </div>
        {audioURL && (
          <div className={`bg-${color}-800 p-4 rounded-lg space-y-4`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold mb-2 text-${color}-100`}>Thank you for your speech!</h3>
            </div>
            
            {isProcessing && (
              <div className={`text-center text-${color}-300`}>
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2">Processing your speech...</p>
              </div>
            )}
            
            {transcribedText && (
              <div className="mb-4">
                <h4 className={`text-md font-semibold mb-2 text-${color}-100`}>Transcription</h4>
                <p className={`text-${color}-300 whitespace-pre-wrap`}>{transcribedText}</p>
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
        <Button
          onClick={generateVoice} 
          variant="ghost" 
          className={`text-${color}-300 hover:text-${color}-100 ${hoverColor} transition-all duration-300
            ${improvedVersion ? 
              category === "Presentation" ? 
                'font-bold shadow-[0_0_15px_3px] shadow-purple-500/50 hover:shadow-[0_0_20px_5px] hover:shadow-purple-500/75 hover:scale-105'
              : category === "Debate Coach" ?
                'font-bold shadow-[0_0_15px_3px] shadow-red-500/50 hover:shadow-[0_0_20px_5px] hover:shadow-red-500/75 hover:scale-105'
              : // Interview Prep
                'font-bold shadow-[0_0_15px_3px] shadow-blue-500/50 hover:shadow-[0_0_20px_5px] hover:shadow-blue-500/75 hover:scale-105'
              : ''
            }`}
          disabled={!improvedVersion || isGeneratingVoice}
        >
          {isGeneratingVoice ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Hear It Improved'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}