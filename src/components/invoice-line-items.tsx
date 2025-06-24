"use client"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LineItem {
  id: number
  description: string
  quantity: number
  price: number
}

interface InvoiceLineItemsProps {
  lineItems: LineItem[]
  addLineItem: () => void
  removeLineItem: (id: number) => void
  updateLineItem: (id: number, field: string, value: string | number) => void
}

export function InvoiceLineItems({ lineItems, addLineItem, removeLineItem, updateLineItem }: InvoiceLineItemsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4 font-medium text-sm">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Quantity</div>
        <div className="col-span-3">Price</div>
        <div className="col-span-1">Amount</div>
        <div className="col-span-1"></div>
      </div>

      {lineItems.map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-5">
            <Input
              value={item.description}
              onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
              placeholder="Description"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateLineItem(item.id, "quantity", Number.parseInt(e.target.value))}
            />
          </div>
          <div className="col-span-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">$</div>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => updateLineItem(item.id, "price", Number.parseFloat(e.target.value))}
                className="pl-7"
              />
            </div>
          </div>
          <div className="col-span-1 font-medium">${(item.quantity * item.price).toFixed(2)}</div>
          <div className="col-span-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLineItem(item.id)}
              disabled={lineItems.length === 1}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="mt-2">
        <Plus className="mr-2 h-4 w-4" />
        Add Line Item
      </Button>
    </div>
  )
}
