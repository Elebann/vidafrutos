import { Link } from "react-router-dom"
import { User, UserPlus } from "lucide-react"
import { PageShell } from "@/components/app/page-shell"
import { ResponsiveList } from "@/components/app/responsive-list"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/app/SearchBar"
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
      description={"Listado total de clientes"}
      icon={User}
      title="Clientes"
    >
      <SearchBar placeholder="Buscar cliente por nombre o RUT" />
      <ResponsiveList
        columns={["Cliente", "RUT", "Dirección", "Acción"]}
        items={customers}
        keyExtractor={(customer) => customer.id}
        renderCard={(customer) => <CustomerCard customer={customer} />}
        renderRow={(customer) => <CustomerRow customer={customer} />}
      />
    </PageShell>
  )
}
