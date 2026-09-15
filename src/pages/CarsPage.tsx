import { CarsBoard } from '../features/cars/components/CarsBoard'
import { CarsProvider } from '../features/cars/state/CarsContext'

export function CarsPage() {
  return (
    <CarsProvider>
      <CarsBoard />
    </CarsProvider>
  )
}
