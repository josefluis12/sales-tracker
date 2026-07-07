import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { NavLink } from "react-router-dom"
import {
  Banknote,
  BarChart3,
  Gauge,
  LogOut,
  Package,
  PhilippinePeso,
  PlusCircle,
  ReceiptText,
  ShoppingBasket,
  Store,
  UserCircle,
} from "lucide-react"
import { useAuth } from "../../features/auth/hooks/use-auth"
import { cn } from "../../lib/utils"

const navItems = [
  { to: "/", label: "Dashboard", icon: Gauge },
  { to: "/products", label: "Products", icon: Package },
  { to: "/product-prices", label: "Prices", icon: PhilippinePeso },
  { to: "/suppliers", label: "Suppliers", icon: Store },
  { to: "/purchases", label: "Purchases", icon: ShoppingBasket },
  { to: "/sales", label: "Sales", icon: Banknote },
  { to: "/sales-report", label: "Sales Report", icon: BarChart3 },
  { to: "/expenses", label: "Expenses", icon: ReceiptText },
]

const mobileNavItems = [
  { to: "/", label: "Home", icon: Gauge },
  { to: "/purchases", label: "Purchases", icon: ShoppingBasket },
  { to: "/sales", label: "Sale", icon: PlusCircle, isPrimary: true },
  { to: "/sales-report", label: "Report", icon: BarChart3 },
  { to: "/expenses", label: "Expenses", icon: ReceiptText },
]

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()
  const [isMobileNavHidden, setIsMobileNavHidden] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const lastScrollYRef = useRef(0)
  const idleTimerRef = useRef<number | undefined>(undefined)
  const desktopAccountMenuRef = useRef<HTMLDivElement>(null)
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node

      if (
        !desktopAccountMenuRef.current?.contains(target) &&
        !mobileAccountMenuRef.current?.contains(target)
      ) {
        setIsAccountMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const renderAccountPanel = (ref: RefObject<HTMLDivElement | null>) => (
    <div className="account-panel" ref={ref}>
      <div className="account-copy">
        <span className="account-label">Signed in</span>
        <span className="account-email">{user?.email}</span>
      </div>
      <button
        type="button"
        className="profile-menu-button"
        aria-label="Open account menu"
        aria-expanded={isAccountMenuOpen}
        onClick={() => {
          setIsAccountMenuOpen((isOpen) => !isOpen)
        }}
      >
        <UserCircle aria-hidden="true" />
      </button>
      <div
        className={cn(
          "account-menu",
          isAccountMenuOpen && "account-menu-open",
        )}
      >
        <span className="account-menu-label">Signed in</span>
        <span className="account-menu-email">{user?.email}</span>
        <button
          type="button"
          className="account-menu-action"
          onClick={() => {
            setIsAccountMenuOpen(false)
            void signOut()
          }}
        >
          <LogOut aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <header className="mobile-app-bar">
        <div className="brand-copy">
          <div className="brand-mark">VB</div>
          <div>
            <p className="brand-title">Vegetable Tracker</p>
            <p className="brand-subtitle">Sales and expense records</p>
          </div>
        </div>
        {renderAccountPanel(mobileAccountMenuRef)}
      </header>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-copy">
            <div className="brand-mark">VB</div>
            <div>
              <p className="brand-title">Vegetable Tracker</p>
              <p className="brand-subtitle">Sales and expense records</p>
            </div>
          </div>
          {renderAccountPanel(desktopAccountMenuRef)}
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
                onClick={() => {
                  setIsAccountMenuOpen(false)
                }}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <nav
        className={cn(
          "mobile-tab-bar",
          isMobileNavHidden && "sidebar-mobile-hidden",
        )}
        aria-label="Mobile navigation"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "mobile-tab-link",
                  item.isPrimary && "mobile-tab-link-primary",
                  isActive && "active",
                )
              }
              onClick={() => {
                setIsAccountMenuOpen(false)
              }}
            >
              <span className="mobile-tab-icon">
                <Icon aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  )
}
