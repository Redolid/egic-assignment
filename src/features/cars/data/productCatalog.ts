import type { ProductTemplate } from '../types'

/** Sample catalog of products that can be dragged onto a car. */
export const productCatalog: ProductTemplate[] = [
  { id: 'tpl-oil', name: 'Engine Oil 5W-30 (4L)', unitPrice: 1250 },
  { id: 'tpl-oil-filter', name: 'Oil Filter', unitPrice: 185.5 },
  { id: 'tpl-air-filter', name: 'Air Filter', unitPrice: 320 },
  { id: 'tpl-brake-pads', name: 'Front Brake Pads', unitPrice: 1899.99 },
  { id: 'tpl-spark-plug', name: 'Spark Plug', unitPrice: 145.75 },
  { id: 'tpl-battery', name: 'Battery 70Ah', unitPrice: 5600 },
  { id: 'tpl-wipers', name: 'Wiper Blades (pair)', unitPrice: 420.25 },
  { id: 'tpl-coolant', name: 'Coolant (1L)', unitPrice: 160.5 },
]
