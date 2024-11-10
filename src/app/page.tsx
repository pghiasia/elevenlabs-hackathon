import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Mic } from "lucide-react"

const categories = [
  { 
    name: "Debate Coach", 
    color: "red", 
    description: "Sharpen your argumentation skills",
    bgColor: "bg-red-900",
    borderColor: "border-red-700",
    textColor: "text-red-100",
    descColor: "text-red-300",
    buttonBg: "bg-red-700 hover:bg-red-600"
  },
  { 
    name: "Presentation", 
    color: "purple", 
    description: "Captivate your audience",
    bgColor: "bg-purple-900",
    borderColor: "border-purple-700",
    textColor: "text-purple-100",
    descColor: "text-purple-300",
    buttonBg: "bg-purple-700 hover:bg-purple-600"
  },
  { 
    name: "Interview Prep", 
    color: "blue", 
    description: "Ace your next job interview",
    bgColor: "bg-blue-900",
    borderColor: "border-blue-700",
    textColor: "text-blue-100",
    descColor: "text-blue-300",
    buttonBg: "bg-blue-700 hover:bg-blue-600"
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6 bg-gray-800 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold">Yapture</h1>
        <img src="/yapture.png" alt="Yapture" className="w-24 h-24 mx-auto" />
        <p className="text-gray-300 text-lg md:text-xl lg:text-2xl mt-2">Your AI Speech Expert</p>
      </header>
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.name} className={`${category.bgColor} ${category.borderColor}`}>
              <CardHeader>
                <CardTitle className={category.textColor}>{category.name}</CardTitle>
                <CardDescription className={category.descColor}>
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/${category.name.toLowerCase().replace(" ", "-")}`}>
                  <Button className={`w-full ${category.buttonBg}`}>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}