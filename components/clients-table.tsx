"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreHorizontal, Phone, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditClientSheet } from "@/components/edit-client-sheet"

interface ClientsTableProps {
    clients: any[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm)
    )

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No clients found</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                    Get started by adding your first client to manage their measurements and orders.
                </p>
                <div className="scale-0"> {/* Hidden trigger hack, usually controlled by parent but keeping structure valid */} </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* SEARCH AND FILTER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 pt-4 pb-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, email, or phone..."
                        className="pl-9 h-9 bg-slate-50 border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredClients.length}</strong> clients
                </div>
            </div>

            <div className="rounded-md border overflow-hidden max-w-[calc(100vw-2rem)] md:max-w-full">
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-6 w-[300px]">Client Name</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead className="hidden md:table-cell">Gender</TableHead>
                                <TableHead className="hidden md:table-cell">Joined</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => (
                                <TableRow
                                    key={client.id}
                                    className="cursor-pointer hover:bg-slate-50/80 transition-colors border-0"
                                    onClick={() => router.push(`/clients/${client.id}`)}
                                >
                                    <TableCell className="pl-6 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {client.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">{client.name}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{client.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-muted-foreground">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4" /> {client.phone || 'N/A'}
                                            </div>
                                            {/* Address removed as it is not in schema */}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="capitalize px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
                                            {client.gender || 'Unspecified'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                        {new Date(client.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">

                                                <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                                                    View Profile
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                    <EditClientSheet
                                                        client={client}
                                                        trigger={<span className="w-full cursor-pointer">Edit Details</span>}
                                                    />
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {filteredClients.length === 0 && searchTerm && (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    No clients found matching "{searchTerm}"
                </div>
            )}
        </div>
    )
}