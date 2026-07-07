import { useEffect, useRef, useState, type ReactNode } from "react"
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
import { cn } from "../../lib/utils"

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
  const [isMobileNavHidden, setIsMobileNavHidden] = useState(false)
  const lastScrollYRef = useRef(0)
  const idleTimerRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 1023px)")

    const clearIdleTimer = () => {
      if (idleTimerRef.current !== undefined) {
        window.clearTimeout(idleTimerRef.current)
        idleTimerRef.current = undefined
      }
    }

    const scheduleIdleHide = () => {
      clearIdleTimer()

      if (!mobileQuery.matches || window.scrollY <= 24) {
        setIsMobileNavHidden(false)
        return
      }

      idleTimerRef.current = window.setTimeout(() => {
        setIsMobileNavHidden(true)
      }, 2000)
    }

    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0)

      if (!mobileQuery.matches) {
        lastScrollYRef.current = currentScrollY
        setIsMobileNavHidden(false)
        clearIdleTimer()
        return
      }

      const isScrollingUp = currentScrollY < lastScrollYRef.current

      if (isScrollingUp || currentScrollY <= 24) {
        setIsMobileNavHidden(false)
      }

      lastScrollYRef.current = currentScrollY
      scheduleIdleHide()
    }

    const handleViewportChange = () => {
      lastScrollYRef.current = Math.max(window.scrollY, 0)
      setIsMobileNavHidden(false)
      scheduleIdleHide()
    }

    lastScrollYRef.current = Math.max(window.scrollY, 0)
    scheduleIdleHide()

    window.addEventListener("scroll", handleScroll, { passive: true })
    mobileQuery.addEventListener("change", handleViewportChange)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      mobileQuery.removeEventListener("change", handleViewportChange)
      clearIdleTimer()
    }
  }, [])

  return (
    <div className="app-shell">
      <aside
        className={cn("sidebar", isMobileNavHidden && "sidebar-mobile-hidden")}
      >
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
            aria-label="Sign out"
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
