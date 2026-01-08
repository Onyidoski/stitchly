'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

interface RecentOrdersProps {
  orders: any[]
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const router = useRouter()

  if (orders.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md">
        No recent orders found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Style/Fabric</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow 
            key={order.id} 
            // Make the row look and act like a link
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push(`/clients/${order.client_id}`)}
          >
            <TableCell>
              <div className="font-medium">
                {/* Handle potential array/object structure from Supabase joins */}
                {Array.isArray(order.clients) 
                    ? order.clients[0]?.name 
                    : order.clients?.name || 'Unknown'}
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                 {Array.isArray(order.clients) 
                    ? order.clients[0]?.email 
                    : order.clients?.email}
              </div>
            </TableCell>
            <TableCell className="truncate max-w-[150px]">
              {order.fabric_description}
            </TableCell>
            <TableCell>
              <Badge variant={order.status === 'delivered' ? 'secondary' : 'default'} className="capitalize">
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              ₦{order.total_amount?.toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}