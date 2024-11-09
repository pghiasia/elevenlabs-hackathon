import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const products = [
  { id: 1, name: "BILLY Bookcase", image: "/placeholder.svg?height=200&width=200" },
  { id: 2, name: "MALM Bed Frame", image: "/placeholder.svg?height=200&width=200" },
  { id: 3, name: "POÄNG Armchair", image: "/placeholder.svg?height=200&width=200" },
  { id: 4, name: "KALLAX Shelf Unit", image: "/placeholder.svg?height=200&width=200" },
  { id: 5, name: "LACK Side Table", image: "/placeholder.svg?height=200&width=200" },
]

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">IKEA Assembly Guide</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Link href={`/product/${product.id}`} key={product.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}