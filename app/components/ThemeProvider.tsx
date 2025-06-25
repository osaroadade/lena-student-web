import { createContext, useContext, useState, useEffect, type JSX, type ReactNode } from "react"
import { useLoaderData, useFetcher } from "react-router"

type Theme = "dark" | "light" | "system"

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined)

type ThemeProviderProps = {
    children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
    const loaderData = useLoaderData() as { theme?: Theme } | undefined
    const serverTheme: Theme = loaderData?.theme ?? "system"
    const fetcher = useFetcher()

    const [theme, setThemeState] = useState<Theme>(serverTheme)

    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        const appliedTheme =
            theme === "system"
                ? window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                : theme

        root.classList.add(appliedTheme)
    }, [theme])

    const setTheme = (newTheme: Theme): void => {
        setThemeState(newTheme)
        fetcher.submit({ theme: newTheme }, { method: "post" })
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = (): ThemeProviderState => {
    const context = useContext(ThemeContext)
    if (!context)
        throw new Error("useTheme must be used within a ThemeProvider")
    return context
}