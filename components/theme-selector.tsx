"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Monitor, Moon, Sun } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ThemeSelector() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="h-10 w-[200px] rounded-md border border-input bg-muted animate-pulse" />
    }

    return (
        <div className="flex flex-col gap-2">
            <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4 text-muted-foreground" />
                            <span>Light</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4 text-muted-foreground" />
                            <span>Dark</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="system">
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <span>System</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
