'use client'

import { Search as SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { useState } from "react"

export function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  
  // Local state for the input field (allows instant typing feedback)
  const [term, setTerm] = useState(searchParams.get('q')?.toString() || '')

  // Debounced callback to update the URL after the user stops typing
  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className="relative flex-1 max-w-sm">
      <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-9 bg-white"
        placeholder={placeholder}
        onChange={(e) => {
            setTerm(e.target.value); // Update local state immediately
            handleSearch(e.target.value); // Debounce the URL update
        }}
        value={term}
      />
    </div>
  )
}