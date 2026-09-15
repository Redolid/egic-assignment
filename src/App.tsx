import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { CarsPage } from './pages/CarsPage'
import { NationalIdPage, TradersMapPage } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/cars" replace />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/national-id" element={<NationalIdPage />} />
          <Route path="/map" element={<TradersMapPage />} />
          <Route path="*" element={<Navigate to="/cars" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
