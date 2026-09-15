import type { Car } from '../types'

/** Sample data the app starts with (and returns to on "Reset demo data"). */
export const seedCars: Car[] = [
  {
    id: 'car-corolla-2023',
    name: 'Toyota Corolla 2023',
    products: [
      { id: 'p-corolla-1', name: 'Engine Oil 5W-30 (4L)', quantity: 2, unitPrice: 1250 },
      { id: 'p-corolla-2', name: 'Oil Filter', quantity: 1, unitPrice: 185.5 },
      { id: 'p-corolla-3', name: 'Front Brake Pads', quantity: 1, unitPrice: 1899.99 },
    ],
  },
  {
    id: 'car-elantra-2022',
    name: 'Hyundai Elantra 2022',
    products: [
      { id: 'p-elantra-1', name: 'Air Filter', quantity: 1, unitPrice: 320 },
      { id: 'p-elantra-2', name: 'Spark Plug', quantity: 4, unitPrice: 145.75 },
    ],
  },
  {
    id: 'car-tucson-2024',
    name: 'Hyundai Tucson 2024',
    products: [
      { id: 'p-tucson-1', name: 'All-Season Tyre 225/60 R17', quantity: 4, unitPrice: 4350 },
      { id: 'p-tucson-2', name: 'Wiper Blades (pair)', quantity: 1, unitPrice: 420.25 },
      { id: 'p-tucson-3', name: 'Cabin Air Filter', quantity: 1, unitPrice: 275 },
      { id: 'p-tucson-4', name: 'Coolant (1L)', quantity: 3, unitPrice: 160.5 },
    ],
  },
  {
    id: 'car-nissan-sunny-2021',
    name: 'Nissan Sunny 2021',
    products: [],
  },
]
