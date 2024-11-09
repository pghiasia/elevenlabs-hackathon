import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Mic } from "lucide-react"

const categories = [
  { name: "Debate Coach", color: "red", description: "Sharpen your argumentation skills" },
  { name: "Interview Prep", color: "blue", description: "Ace your next job interview" },
  { name: "Presentation", color: "purple", description: "Captivate your audience" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6 bg-gray-800">
        <h1 className="text-3xl font-bold">Yapture</h1>
        <p className="text-gray-300">Your AI Speech Expert</p>
      </header>
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.name} className={`bg-${category.color}-900 border-${category.color}-700`}>
              <CardHeader>
                <CardTitle className={`text-xl text-${category.color}-100`}>{category.name}</CardTitle>
                <CardDescription className={`text-${category.color}-300`}>
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/${category.name.toLowerCase().replace(" ", "-")}`}>
                  <Button className={`w-full bg-${category.color}-700 hover:bg-${category.color}-600`}>
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