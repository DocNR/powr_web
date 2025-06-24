"use client"

import * as React from "react"
import { SunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-9 w-9 px-0" 
      onClick={toggleTheme}
    >
      <SunMoon className="h-[1.2rem] w-[1.2rem] transition-transform duration-300 hover:rotate-12" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
