import { Link } from "react-router-dom"
import { UserPlus } from "lucide-react"

import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/app/SearchBar"
import { formatCurrency } from "@/lib/format"
import { useEffect, useState } from "react"
import apiClients from "@/lib/apiClients"
import type { Customer } from "@/types/domain"

function CustomerCard({ customer }: { customer: Customer }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <p className="font-semibold">{customer.name}</p>
      <p className="text-sm text-muted-foreground">{customer.rut}</p>
      <p className="mt-2 text-sm">{customer.address}</p>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge tone={customer.balance > 0 ? "yellow" : "green"}>
          {customer.balance > 0
            ? formatCurrency(customer.balance)
            : "Al dia"}
        </StatusBadge>
        <Button
          size="sm"
          render={<Link to={`/clientes/${customer.id}`} />}
          variant="outline"
        >
          Ficha
        </Button>
      </div>
    </div>
  )
}

function CustomerRow({ customer }: { customer: Customer }) {
  return (
    <>
      <td className="px-4 py-3 font-medium">{customer.name}</td>
      <td className="px-4 py-3">{customer.rut}</td>
      <td className="px-4 py-3">{customer.address}</td>
      <td className="px-4 py-3">
        {customer.balance > 0
          ? formatCurrency(customer.balance)
          : "Al dia"}
      </td>
      <td className="px-4 py-3">
        <Button
          size="sm"
          render={<Link to={`/clientes/${customer.id}`} />}
          variant="outline"
        >
          Ver
        </Button>
      </td>
    </>
  )
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    apiClients.fetchCustomers().then(setCustomers).catch(() => {})
  }, [])

  return (
    <PageShell
      action={{ icon: UserPlus, label: "Nuevo cliente", to: "/clientes/nuevo" }}
      description="Directorio comercial para ventas en terreno."
      icon={UserPlus}
      title="Clientes"
    >
      <SearchBar placeholder="Buscar cliente por nombre o RUT" />
      <ResponsiveList
        columns={["Cliente", "RUT", "Direccion", "Saldo", "Accion"]}
        items={customers}
        keyExtractor={(customer) => customer.id}
        renderCard={(customer) => <CustomerCard customer={customer} />}
        renderRow={(customer) => <CustomerRow customer={customer} />}
      />
    </PageShell>
  )
}
