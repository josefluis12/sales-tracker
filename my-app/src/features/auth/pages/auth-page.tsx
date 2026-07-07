import { useState, type FormEvent } from "react"
import { Leaf, Loader2, LockKeyhole } from "lucide-react"
import { Button } from "../../../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { getErrorMessage } from "../../../lib/utils"
import { signInWithPassword } from "../services/auth-service"

export function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    try {
      await signInWithPassword({ email, password })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ddf7d4,_transparent_32rem),linear-gradient(135deg,_#f7f8f4,_#e9f3ed)] px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-6 lg:grid lg:grid-cols-[1fr_420px] lg:items-center">
        <section className="order-2 pb-4 lg:order-1 lg:pb-0">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#163824] text-white shadow-sm">
            <Leaf className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-normal text-[#163824] sm:text-4xl">
            Vegetable business records in your pocket.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#526059]">
            Sign in to manage products, sales, purchases, expenses, and daily
            summaries from a mobile-friendly dashboard.
          </p>
          <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {["Sales", "Purchases", "Expenses", "Suppliers"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-[#dce4dc] bg-white/80 px-3 py-3 font-semibold text-[#1f2a24] shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <Card className="order-1 w-full rounded-lg border-[#dce4dc] shadow-xl lg:order-2">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Sign in with your Supabase email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {errorMessage}
                </p>
              ) : null}

              <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
