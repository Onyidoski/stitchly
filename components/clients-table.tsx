'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ChevronRight, Search, Users } from "lucide-react"

export function ClientsTable({ clients }: { clients: any[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  // Filter clients based on search input
  const filteredClients = clients.filter((client) => {
    const query = search.toLowerCase()
    return (
      client.name.toLowerCase().includes(query) ||
      (client.phone && client.phone.includes(query))
    )
  })

  if (!clients || clients.length === 0) {
     return (
        <div className="text-center py-10 text-muted-foreground">
          No clients found. Add your first client above.
        </div>
     )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow 
                  key={client.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <TableCell>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{client.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.phone || '-'}</TableCell>
                  <TableCell className="capitalize">{client.gender}</TableCell>
                  <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-foreground transition-colors" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                   No clients match "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}