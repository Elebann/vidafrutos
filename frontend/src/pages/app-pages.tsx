import {
  AlertTriangle,
  Archive,
  BarChart3,
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Factory,
  FileClock,
  Package,
  PackageCheck,
  PackagePlus,
  Receipt,
  Search,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { FormCard, TextField } from "@/components/app/form-card"
import { KpiCard } from "@/components/app/kpi-card"
import { PageShell, SectionCard } from "@/components/app/page-shell"
import { MobileCard, ResponsiveList } from "@/components/app/responsive-list"
import { StatusBadge, type BadgeTone } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  categories,
  customers,
  forecasts,
  formatCurrency,
  getCriticalStocks,
  getCustomer,
  getMissingUnits,
  getOrderTotal,
  getPackagedStock,
  getProduct,
  invoices,
  movements,
  orders,
  packagedStock,
  products,
  rawStock,
  roles,
  users,
} from "@/data/mock-data"
import type { Order, OrderState } from "@/types/domain"

function orderTone(state: OrderState): BadgeTone {
  if (state === "Despachado" || state === "Facturado") return "green"
  if (state === "En produccion") return "yellow"
  if (state === "Listo para despacho") return "blue"
  return "neutral"
}

function riskTone(risk: string): BadgeTone {
  if (risk === "Alto") return "red"
  if (risk === "Medio") return "yellow"
  return "green"
}

function ProductLine({ productId, quantity }: { productId: number; quantity: number }) {
  const product = getProduct(productId)
  const missing = getMissingUnits(productId, quantity)

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-neutral-50 px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{product?.name}</p>
        <p className="text-xs text-muted-foreground">{quantity} unidades solicitadas</p>
      </div>
      {missing > 0 ? <StatusBadge tone="red">Faltan {missing}</StatusBadge> : <StatusBadge tone="green">Disponible</StatusBadge>}
    </div>
  )
}

function SearchBar({ placeholder = "Buscar" }: { placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-10 bg-white pl-9" placeholder={placeholder} />
    </div>
  )
}

export function DashboardPage() {
  const critical = getCriticalStocks()
  const pendingOrders = orders.filter((order) => order.state !== "Despachado" && order.state !== "Facturado")
  const dailySales = invoices.reduce((total, invoice) => total + invoice.total, 0)

  return (
    <PageShell
      description="Resumen operacional para ventas, inventario y produccion diaria."
      icon={BarChart3}
      title="Inicio"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          detail="Facturas emitidas hoy y ayer operacional."
          icon={CreditCard}
          label="Ventas recientes"
          value={formatCurrency(dailySales)}
        />
        <KpiCard
          detail="Pedidos que aun requieren validacion, produccion o despacho."
          icon={ClipboardList}
          label="Pedidos activos"
          tone="warning"
          value={`${pendingOrders.length}`}
        />
        <KpiCard
          detail="Productos bajo o igual al minimo configurado."
          icon={AlertTriangle}
          label="Stock critico"
          tone="danger"
          value={`${critical.length}`}
        />
        <KpiCard
          detail="Promedio estimado del modulo predictivo."
          icon={BrainCircuit}
          label="Confianza IA"
          tone="success"
          value="82%"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Acciones rapidas">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: PackagePlus,
                label: "Nuevo pedido",
                to: "/pedidos/nuevo",
              },
              {
                icon: Archive,
                label: "Actualizar stock",
                to: "/inventario/actualizar",
              },
              {
                icon: Factory,
                label: "Registrar produccion",
                to: "/produccion/registrar",
              },
              {
                icon: Receipt,
                label: "Generar factura",
                to: "/facturas/generar",
              },
            ].map((item) => (
              <Button
                className="h-11 justify-start"
                key={item.label}
                render={<Link to={item.to} />}
                variant="outline"
              >
                <item.icon className="size-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Alertas de stock">
          <div className="grid gap-2">
            {critical.map((stock) => {
              const product = getProduct(stock.productId)
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-red-100 bg-red-50 px-3 py-2"
                  key={stock.productId}
                >
                  <div>
                    <p className="text-sm font-medium">{product?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Minimo {stock.minimumStock} unidades
                    </p>
                  </div>
                  <StatusBadge tone="red">
                    {stock.availableStock} disp.
                  </StatusBadge>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Pedidos para hoy">
        <ResponsiveList
          columns={["Pedido", "Cliente", "Estado", "Total", "Accion"]}
          items={orders}
          keyExtractor={(order) => order.id}
          renderCard={(order) => <OrderCard order={order} />}
          renderRow={(order) => <OrderRow order={order} />}
        />
      </SectionCard>
    </PageShell>
  )
}

function OrderCard({ order }: { order: Order }) {
  const customer = getCustomer(order.customerId)
  const hasMissing = order.details.some((detail) => getMissingUnits(detail.productId, detail.quantity) > 0)

  return (
    <MobileCard>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Pedido #{order.id}</p>
          <p className="text-sm text-muted-foreground">{customer?.name}</p>
        </div>
        <StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge>
      </div>
      <div className="mb-3 grid gap-2">{order.details.slice(0, 2).map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{formatCurrency(getOrderTotal(order))}</span>
        {hasMissing && <StatusBadge tone="red">Con faltantes</StatusBadge>}
        <Button size="sm" render={<Link to={`/pedidos/${order.id}`} />} variant="outline">
          Ver detalle
        </Button>
      </div>
    </MobileCard>
  )
}

function OrderRow({ order }: { order: Order }) {
  const customer = getCustomer(order.customerId)
  return (
    <>
      <td className="px-4 py-3 font-medium">#{order.id}</td>
      <td className="px-4 py-3">{customer?.name}</td>
      <td className="px-4 py-3"><StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge></td>
      <td className="px-4 py-3 font-medium">{formatCurrency(getOrderTotal(order))}</td>
      <td className="px-4 py-3"><Button size="sm" render={<Link to={`/pedidos/${order.id}`} />} variant="outline">Ver</Button></td>
    </>
  )
}

export function OrdersPage() {
  return (
    <PageShell action={{ icon: PackagePlus, label: "Nuevo pedido", to: "/pedidos/nuevo" }} description="Registro, validacion de stock y seguimiento de pedidos." icon={ClipboardList} title="Pedidos">
      <SearchBar placeholder="Buscar por cliente, estado o numero de pedido" />
      <ResponsiveList columns={["Pedido", "Cliente", "Estado", "Total", "Accion"]} items={orders} keyExtractor={(order) => order.id} renderCard={(order) => <OrderCard order={order} />} renderRow={(order) => <OrderRow order={order} />} />
    </PageShell>
  )
}

export function NewOrderPage() {
  return (
    <PageShell description="Formulario pensado para registrar pedidos en terreno desde telefono." icon={PackagePlus} title="Nuevo pedido">
      <FormCard submitLabel="Registrar pedido" title="Datos del pedido">
        <FieldGroup>
          <Field>
            <FieldLabel>Cliente</FieldLabel>
            <select className="h-10 rounded-lg border bg-white px-3 text-sm">
              {customers.map((customer) => <option key={customer.id}>{customer.name}</option>)}
            </select>
          </Field>
        </FieldGroup>
        <TextField label="Fecha solicitada" type="date" value="2026-05-15" />
        {products.filter((product) => product.active).slice(0, 4).map((product) => {
          const stock = getPackagedStock(product.id)
          return (
            <FieldGroup key={product.id}>
              <Field>
                <FieldLabel>{product.name}</FieldLabel>
                <Input placeholder={`Disponible: ${stock?.availableStock ?? 0}`} type="number" />
              </Field>
            </FieldGroup>
          )
        })}
      </FormCard>
      <SectionCard title="Validacion visual de stock">
        <div className="grid gap-2">
          <ProductLine productId={2} quantity={96} />
          <ProductLine productId={4} quantity={42} />
        </div>
      </SectionCard>
    </PageShell>
  )
}

export function OrderDetailPage() {
  const { orderId } = useParams()
  const order = orders.find((item) => item.id === Number(orderId)) ?? orders[0]
  const customer = getCustomer(order.customerId)

  return (
    <PageShell description={`${customer?.name} - solicitado para ${order.requestedDate}`} icon={ClipboardCheck} title={`Pedido #${order.id}`}>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Productos solicitados">
          <div className="grid gap-2">{order.details.map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted-foreground">Total estimado</span>
            <strong className="text-lg">{formatCurrency(getOrderTotal(order))}</strong>
          </div>
        </SectionCard>
        <FormCard submitLabel="Actualizar estado" title="Cambio de estado">
          <FieldGroup>
            <Field>
              <FieldLabel>Estado</FieldLabel>
              <select className="h-10 rounded-lg border bg-white px-3 text-sm" defaultValue={order.state}>
                {["Registrado", "Validado", "En produccion", "Listo para despacho", "Despachado", "Facturado"].map((state) => <option key={state}>{state}</option>)}
              </select>
            </Field>
          </FieldGroup>
          <TextField label="Observacion" placeholder="Motivo del cambio" />
        </FormCard>
      </div>
      <SectionCard title="Historial de modificaciones">
        <div className="grid gap-2">
          {order.history.map((item) => (
            <div className="rounded-md border bg-neutral-50 px-3 py-2 text-sm" key={`${item.date}-${item.field}`}>
              <p className="font-medium">{item.field}: {item.previousValue} {"->"} {item.newValue}</p>
              <p className="text-xs text-muted-foreground">{item.date} por {item.user}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

export function CustomersPage() {
  return (
    <PageShell
      action={{ icon: UserPlus, label: "Nuevo cliente", to: "/clientes/nuevo" }}
      description="Directorio comercial para ventas en terreno."
      icon={Users}
      title="Clientes"
    >
      <SearchBar placeholder="Buscar cliente por nombre o RUT" />
      <ResponsiveList
        columns={["Cliente", "RUT", "Direccion", "Saldo", "Accion"]}
        items={customers}
        keyExtractor={(customer) => customer.id}
        renderCard={(customer) => (
          <MobileCard>
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
          </MobileCard>
        )}
        renderRow={(customer) => (
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
        )}
      />
    </PageShell>
  )
}

export function CustomerFormPage() {
  return (
    <PageShell description="Mantencion de clientes mayoristas." icon={UserPlus} title="Nuevo cliente">
      <FormCard submitLabel="Guardar cliente" title="Datos del cliente">
        <TextField label="RUT" placeholder="76.000.000-0" />
        <TextField label="Nombre" placeholder="Nombre del negocio" />
        <TextField label="Direccion" placeholder="Calle, comuna" />
      </FormCard>
    </PageShell>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const customer = customers.find((item) => item.id === Number(customerId)) ?? customers[0]
  const customerOrders = orders.filter((order) => order.customerId === customer.id)
  return (
    <PageShell description={customer.address} icon={Users} title={customer.name}>
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Ficha comercial">
          <dl className="grid gap-3 text-sm">
            <div><dt className="text-muted-foreground">RUT</dt><dd className="font-medium">{customer.rut}</dd></div>
            <div><dt className="text-muted-foreground">Ultimo pedido</dt><dd className="font-medium">{customer.lastOrderDate}</dd></div>
            <div><dt className="text-muted-foreground">Saldo</dt><dd className="font-medium">{customer.balance > 0 ? formatCurrency(customer.balance) : "Al dia"}</dd></div>
          </dl>
        </SectionCard>
        <SectionCard title="Pedidos recientes">
          <div className="grid gap-2">{customerOrders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
        </SectionCard>
      </div>
    </PageShell>
  )
}

export function ProductsPage() {
  return (
    <PageShell action={{ icon: PackagePlus, label: "Nuevo producto", to: "/productos/nuevo" }} description="Catalogo comercial y configuracion de categorias." icon={Package} title="Productos">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Catalogo">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <MobileCard key={product.id}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <p className="font-semibold">{product.name}</p>
                  <StatusBadge tone={product.active ? "green" : "neutral"}>{product.active ? "Activo" : "Inactivo"}</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{categories.find((category) => category.id === product.categoryId)?.name}</p>
                <p className="mt-3 text-lg font-semibold">{formatCurrency(product.price)}</p>
              </MobileCard>
            ))}
          </div>
        </SectionCard>
        <FormCard submitLabel="Guardar categoria" title="Nueva categoria">
          <TextField label="Nombre categoria" placeholder="Ej: Snacks premium" />
        </FormCard>
      </div>
    </PageShell>
  )
}

export function ProductFormPage() {
  return (
    <PageShell description="Alta o modificacion de producto comercializable." icon={PackagePlus} title="Nuevo producto">
      <FormCard submitLabel="Guardar producto" title="Datos del producto">
        <TextField label="Nombre" placeholder="Mani salado 250g" />
        <FieldGroup>
          <Field>
            <FieldLabel>Categoria</FieldLabel>
            <select className="h-10 rounded-lg border bg-white px-3 text-sm">{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select>
          </Field>
        </FieldGroup>
        <TextField label="Precio" placeholder="1850" type="number" />
        <TextField label="Stock minimo" placeholder="200" type="number" />
        <FieldGroup>
          <Field className="rounded-lg border bg-white p-3" orientation="horizontal">
            <Checkbox defaultChecked />
            <FieldLabel>Producto activo</FieldLabel>
          </Field>
        </FieldGroup>
      </FormCard>
    </PageShell>
  )
}

export function InventoryPage() {
  return (
    <PageShell action={{ icon: Archive, label: "Actualizar inventario", to: "/inventario/actualizar" }} description="Stock envasado, materia prima y trazabilidad de movimientos." icon={Boxes} title="Inventario">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Stock envasado">
          <div className="grid gap-3 sm:grid-cols-2">
            {packagedStock.map((stock) => {
              const product = getProduct(stock.productId)
              const critical = stock.availableStock <= stock.minimumStock
              return (
                <MobileCard key={stock.productId}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <p className="font-semibold">{product?.name}</p>
                    <StatusBadge tone={critical ? "red" : "green"}>{critical ? "Critico" : "OK"}</StatusBadge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div><strong>{stock.availableStock}</strong><span className="block text-xs text-muted-foreground">Disp.</span></div>
                    <div><strong>{stock.allocatedStock}</strong><span className="block text-xs text-muted-foreground">Reserv.</span></div>
                    <div><strong>{stock.minimumStock}</strong><span className="block text-xs text-muted-foreground">Min.</span></div>
                  </div>
                </MobileCard>
              )
            })}
          </div>
        </SectionCard>
        <SectionCard title="Materia prima">
          <div className="grid gap-2">
            {rawStock.map((stock) => <ProductLine key={stock.productId} productId={stock.productId} quantity={Math.round(stock.quantityKilogram)} />)}
          </div>
        </SectionCard>
      </div>
      <MovementsSection />
    </PageShell>
  )
}

function MovementsSection() {
  return (
    <SectionCard title="Historial de movimientos">
      <div className="grid gap-2">
        {movements.map((movement) => (
          <div className="grid gap-1 rounded-md border bg-neutral-50 px-3 py-2 text-sm sm:grid-cols-[1fr_auto] sm:items-center" key={movement.id}>
            <div>
              <p className="font-medium">{getProduct(movement.productId)?.name} - {movement.description}</p>
              <p className="text-xs text-muted-foreground">{movement.date}</p>
            </div>
            <StatusBadge tone={movement.movementType === "MERMA" ? "red" : movement.movementType === "ENTRADA" ? "green" : "yellow"}>
              {movement.movementType} {movement.quantity}
            </StatusBadge>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export function InventoryUpdatePage() {
  return (
    <PageShell description="Ajustes manuales y movimientos de materia prima." icon={Archive} title="Actualizar inventario">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormCard submitLabel="Registrar movimiento" title="Movimiento de materia prima">
          <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
          <FieldGroup><Field><FieldLabel>Tipo</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm"><option>ENTRADA</option><option>SALIDA</option><option>AJUSTE</option><option>MERMA</option></select></Field></FieldGroup>
          <TextField label="Cantidad kilos" type="number" />
          <TextField label="Descripcion" placeholder="Motivo del movimiento" />
        </FormCard>
        <FormCard submitLabel="Actualizar stock" title="Stock envasado">
          <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
          <TextField label="Disponible" type="number" />
          <TextField label="Reservado" type="number" />
          <TextField label="Minimo" type="number" />
        </FormCard>
      </div>
    </PageShell>
  )
}

export function ProductionPage() {
  const suggestions = forecasts.filter((forecast) => forecast.suggestedProduction > 0)
  return (
    <PageShell action={{ icon: Factory, label: "Registrar produccion", to: "/produccion/registrar" }} description="Planificacion diaria basada en faltantes y demanda esperada." icon={Factory} title="Produccion">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Sugerencias de produccion">
          <div className="grid gap-2">
            {suggestions.map((forecast) => <ProductLine key={forecast.productId} productId={forecast.productId} quantity={forecast.suggestedProduction} />)}
          </div>
        </SectionCard>
        <MovementsSection />
      </div>
    </PageShell>
  )
}

export function ProductionFormPage() {
  return (
    <PageShell description="Registro de envasado diario y consumo de materia prima." icon={Factory} title="Registrar produccion">
      <FormCard submitLabel="Registrar produccion" title="Produccion diaria">
        <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.filter((product) => product.active).map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
        <TextField label="Cantidad producida" type="number" />
        <TextField label="Consumo materia prima (kg)" type="number" />
        <TextField label="Observacion" placeholder="Lote, turno o comentario" />
      </FormCard>
    </PageShell>
  )
}

export function DispatchPage() {
  const dispatchOrders = orders.filter((order) => order.state === "Listo para despacho" || order.state === "En produccion" || order.state === "Validado")
  return (
    <PageShell description="Armado de cajas y confirmacion de salida." icon={Truck} title="Despacho">
      <div className="grid gap-3">
        {dispatchOrders.map((order) => (
          <SectionCard key={order.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Pedido #{order.id}</h2>
                <p className="text-sm text-muted-foreground">{getCustomer(order.customerId)?.name}</p>
              </div>
              <StatusBadge tone={orderTone(order.state)}>{order.state}</StatusBadge>
            </div>
            <div className="grid gap-2">{order.details.map((detail) => <ProductLine key={detail.productId} {...detail} />)}</div>
            <Button className="mt-4 w-full sm:w-auto" variant="VFBrown">Confirmar despacho</Button>
          </SectionCard>
        ))}
      </div>
    </PageShell>
  )
}

export function InvoicesPage() {
  return (
    <PageShell action={{ icon: Receipt, label: "Generar factura", to: "/facturas/generar" }} description="Facturas emitidas y resumen de pagos." icon={Receipt} title="Facturacion">
      <div className="grid gap-3 sm:grid-cols-3">
        {["Efectivo", "Transferencia", "Debito/Credito"].map((method) => <KpiCard detail="Resumen simulado del periodo." icon={CreditCard} key={method} label={method} value={formatCurrency(method === "Transferencia" ? 153200 : 45800)} />)}
      </div>
      <ResponsiveList
        columns={["Factura", "Pedido", "Fecha", "Metodo", "Total"]}
        items={invoices}
        keyExtractor={(invoice) => invoice.id}
        renderCard={(invoice) => (
          <MobileCard>
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-semibold">Factura #{invoice.id}</p><p className="text-sm text-muted-foreground">Pedido #{invoice.orderId}</p></div>
              <StatusBadge tone="green">{invoice.paymentMethod}</StatusBadge>
            </div>
            <p className="mt-3 text-lg font-semibold">{formatCurrency(invoice.total)}</p>
          </MobileCard>
        )}
        renderRow={(invoice) => (
          <>
            <td className="px-4 py-3 font-medium">#{invoice.id}</td>
            <td className="px-4 py-3">#{invoice.orderId}</td>
            <td className="px-4 py-3">{invoice.date}</td>
            <td className="px-4 py-3">{invoice.paymentMethod}</td>
            <td className="px-4 py-3 font-medium">{formatCurrency(invoice.total)}</td>
          </>
        )}
      />
    </PageShell>
  )
}

export function InvoiceFormPage() {
  return (
    <PageShell description="Emision simulada desde un pedido validado." icon={Receipt} title="Generar factura">
      <FormCard submitLabel="Generar factura" title="Datos tributarios">
        <FieldGroup><Field><FieldLabel>Pedido</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{orders.map((order) => <option key={order.id}>Pedido #{order.id} - {getCustomer(order.customerId)?.name}</option>)}</select></Field></FieldGroup>
        <FieldGroup><Field><FieldLabel>Metodo de pago</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm"><option>Transferencia</option><option>Efectivo</option><option>Debito</option><option>Credito</option></select></Field></FieldGroup>
        <TextField label="Total" type="number" value="86200" />
      </FormCard>
    </PageShell>
  )
}

export function ForecastPage() {
  return (
    <PageShell description="Pronostico simulado alimentado por ventas historicas y pedidos recientes." icon={BrainCircuit} title="Prediccion IA">
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard detail="Promedio de los productos evaluados." icon={BrainCircuit} label="Confianza promedio" tone="success" value="82%" />
        <KpiCard detail="Productos con riesgo alto de quiebre." icon={AlertTriangle} label="Riesgo alto" tone="danger" value="2" />
        <KpiCard detail="Unidades sugeridas para producir." icon={Factory} label="Produccion sugerida" tone="warning" value="500" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {forecasts.map((forecast) => {
          const product = getProduct(forecast.productId)
          return (
            <SectionCard key={forecast.productId}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h2 className="font-semibold">{product?.name}</h2><p className="text-sm text-muted-foreground">Ventas esperadas: {forecast.expectedSales} unidades</p></div>
                <StatusBadge tone={riskTone(forecast.risk)}>Riesgo {forecast.risk}</StatusBadge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-neutral-50 p-3"><strong>{forecast.suggestedProduction}</strong><span className="block text-muted-foreground">Producir</span></div>
                <div className="rounded-md bg-neutral-50 p-3"><strong>{forecast.confidence}%</strong><span className="block text-muted-foreground">Confianza</span></div>
              </div>
            </SectionCard>
          )
        })}
      </div>
    </PageShell>
  )
}

export function ReportsPage() {
  return (
    <PageShell description="Indicadores para medir mejoras operacionales del proyecto." icon={BarChart3} title="Reportes">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard detail="Meta del informe: sobre 90%." icon={PackageCheck} label="Exactitud inventario" tone="success" value="93%" />
        <KpiCard detail="Tiempo promedio simulado de armado." icon={ClipboardCheck} label="Preparacion" value="42 min" />
        <KpiCard detail="Eventos de stock bajo del periodo." icon={AlertTriangle} label="Quiebres" tone="danger" value="4" />
        <KpiCard detail="Pedidos finalizados a tiempo." icon={Truck} label="Despachos OK" tone="success" value="91%" />
      </div>
      <SectionCard title="Lectura rapida">
        <div className="grid gap-2 text-sm text-neutral-700">
          <p>Las ventas se concentran en mani sin sal y mani salado, por lo que sus umbrales deben mantenerse sobre 200 unidades.</p>
          <p>Los quiebres proyectados vienen principalmente desde productos con baja rotacion que se producen tarde.</p>
          <p>La preparacion mejora cuando los pedidos quedan validados antes del cierre del dia anterior.</p>
        </div>
      </SectionCard>
    </PageShell>
  )
}

export function AdminUsersPage() {
  return (
    <PageShell description="Usuarios, roles, estados y alertas base del sistema." icon={ShieldCheck} title="Administracion">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Usuarios">
          <div className="grid gap-2">
            {users.map((user) => <div className="flex items-center justify-between gap-3 rounded-md border bg-neutral-50 px-3 py-2" key={user.id}><div><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.rut}</p></div><StatusBadge tone={user.active ? "green" : "neutral"}>{roles.find((role) => role.id === user.roleId)?.name}</StatusBadge></div>)}
          </div>
        </SectionCard>
        <FormCard submitLabel="Guardar usuario" title="Nuevo usuario">
          <TextField label="RUT" />
          <TextField label="Username" />
          <FieldGroup><Field><FieldLabel>Rol</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{roles.map((role) => <option key={role.id}>{role.name}</option>)}</select></Field></FieldGroup>
        </FormCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <FormCard submitLabel="Guardar rol" title="Rol">
          <TextField label="Nombre rol" />
          <TextField label="Permisos" placeholder="Pedidos, Inventario" />
        </FormCard>
        <FormCard submitLabel="Guardar estado" title="Estado de pedido">
          <TextField label="Nombre estado" />
        </FormCard>
        <FormCard submitLabel="Guardar alerta" title="Alerta de stock">
          <FieldGroup><Field><FieldLabel>Producto</FieldLabel><select className="h-10 rounded-lg border bg-white px-3 text-sm">{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></Field></FieldGroup>
          <TextField label="Umbral minimo" type="number" />
        </FormCard>
      </div>
    </PageShell>
  )
}

export function AuditPage() {
  const history = orders.flatMap((order) => order.history.map((item) => ({ ...item, orderId: order.id })))
  return (
    <PageShell description="Trazabilidad de pedidos y movimientos de inventario." icon={FileClock} title="Auditoria">
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cambios de pedidos">
          <div className="grid gap-2">
            {history.map((item) => <div className="rounded-md border bg-neutral-50 px-3 py-2 text-sm" key={`${item.orderId}-${item.date}`}><p className="font-medium">Pedido #{item.orderId}: {item.field}</p><p className="text-xs text-muted-foreground">{item.previousValue} {"->"} {item.newValue} por {item.user}</p></div>)}
          </div>
        </SectionCard>
        <MovementsSection />
      </div>
    </PageShell>
  )
}
