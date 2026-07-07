import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import {
  Banknote,
  Gauge,
  LogOut,
  Package,
  PhilippinePeso,
  ReceiptText,
  ShoppingBasket,
  Store,
} from "lucide-react"
import { Button } from "../ui/button"
import { useAuth } from "../../features/auth/hooks/use-auth"

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/products", label: "Products", icon: Package },
  { to: "/product-prices", label: "Prices", icon: PhilippinePeso },
  { to: "/suppliers", label: "Suppliers", icon: Store },
  { to: "/purchases", label: "Purchases", icon: ShoppingBasket },
  { to: "/sales", label: "Sales", icon: Banknote },
  { to: "/expenses", label: "Expenses", icon: ReceiptText },
]

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">VB</div>
          <div>
            <p className="brand-title">Vegetable Tracker</p>
            <p className="brand-subtitle">Sales and expense records</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="account-panel">
          <div className="account-copy">
            <span className="account-label">Signed in</span>
            <span className="account-email">{user?.email}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="account-button"
            onClick={() => {
              void signOut()
            }}
          >
            <LogOut aria-hidden="true" />
            <span>Sign out</span>
          </Button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  )
}
