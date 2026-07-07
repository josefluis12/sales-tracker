import { BrowserRouter } from "react-router-dom"
import { AppLayout } from "../components/layout/app-layout"
import { AuthProvider } from "../features/auth/hooks/auth-provider"
import { useAuth } from "../features/auth/hooks/use-auth"
import { AuthPage } from "../features/auth/pages/auth-page"
import { AppRoutes } from "./routes"

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </AuthProvider>
  )
}

function AuthenticatedApp() {
  const { isLoading, session } = useAuth()

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4">
        <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm font-semibold text-muted-foreground shadow-sm">
          Loading your workspace...
        </div>
      </main>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  )
}
