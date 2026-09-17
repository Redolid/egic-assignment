import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { EgicMark } from '../../../components/graphics/Illustrations'
import { formatAmount } from '../lib/format'
import { buildPriceSummary } from '../lib/summary'
import type { Car } from '../types'

const printedAtFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short' })
const fileDateFormat = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short' })

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * The printed version of the page: every vehicle's lines and total, then the grand total.
 * Hidden on screen; `print:` utilities swap it in for the interactive board (see CarsBoard).
 * `.price-sheet` pins the light palette, so printing from dark mode still gives a white page.
 */
export function PriceSummary({ cars }: { cars: Car[] }) {
  const [printedAt, setPrintedAt] = useState(() => new Date())
  const summary = buildPriceSummary(cars)

  // Stamp the real print time (also for Ctrl+P) and give "Save as PDF" a useful file name.
  useEffect(() => {
    let previousTitle = document.title
    const before = () => {
      const now = new Date()
      flushSync(() => setPrintedAt(now))
      previousTitle = document.title
      document.title = `EGIC price summary ${fileDateFormat.format(now)}`
    }
    const after = () => {
      document.title = previousTitle
    }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  return (
    <article className="price-sheet hidden text-[10pt] text-fg print:block">
      <header className="flex items-start justify-between gap-6 border-b-2 border-accent pb-3">
        <div className="flex items-center gap-3">
          <EgicMark width={34} height={34} />
          <div>
            <p className="text-[9pt] text-fg-muted">EGIC · Cars &amp; Products</p>
            <h1 className="text-[18pt] font-semibold leading-tight">Price summary</h1>
          </div>
        </div>
        <div className="text-right text-[9pt] text-fg-muted">
          <p>Printed {printedAtFormat.format(printedAt)}</p>
          <p className="figures">
            {plural(summary.vehicles.length, 'vehicle')} · {plural(summary.lineCount, 'line')} · {plural(summary.unitCount, 'unit')}
          </p>
        </div>
      </header>

      {summary.vehicles.map((vehicle) => (
        <section key={vehicle.id} className="mt-4 break-inside-avoid">
          <h2 className="flex items-baseline justify-between gap-4 text-[12pt] font-semibold">
            {vehicle.name}
            <span className="figures text-[9pt] font-normal text-fg-muted">
              {plural(vehicle.lines.length, 'line')} · {plural(vehicle.units, 'unit')}
            </span>
          </h2>
          <table className="figures mt-1.5 w-full border-collapse">
            <thead>
              <tr className="border-b border-line-strong text-[8.5pt] text-fg-muted">
                <th scope="col" className="w-8 py-1 text-left font-medium">No.</th>
                <th scope="col" className="py-1 text-left font-medium">Item</th>
                <th scope="col" className="w-16 py-1 text-right font-medium">Qty</th>
                <th scope="col" className="w-32 py-1 text-right font-medium">Unit price, EGP</th>
                <th scope="col" className="w-32 py-1 text-right font-medium">Subtotal, EGP</th>
              </tr>
            </thead>
            <tbody>
              {vehicle.lines.length === 0 && (
                <tr className="border-b border-line">
                  <td colSpan={5} className="py-1 text-fg-muted">
                    No items
                  </td>
                </tr>
              )}
              {vehicle.lines.map((line, index) => (
                <tr key={line.id} className="border-b border-line">
                  <td className="py-1 text-fg-muted">{index + 1}</td>
                  <td className="py-1">{line.name}</td>
                  <td className="py-1 text-right">{line.quantity}</td>
                  <td className="py-1 text-right">{formatAmount(line.unitPrice)}</td>
                  <td className="py-1 text-right">{formatAmount(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={4} className="pt-1 text-right font-semibold">
                  Vehicle total
                </th>
                <td className="pt-1 text-right font-semibold">{formatAmount(vehicle.total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ))}

      <section className="mt-6 break-inside-avoid">
        <h2 className="text-[12pt] font-semibold">Totals</h2>
        <table className="figures mt-1.5 w-full border-collapse">
          <tbody>
            {summary.vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-b border-line">
                <th scope="row" className="py-1 text-left font-normal">
                  {vehicle.name}
                </th>
                <td className="w-32 py-1 text-right">{formatAmount(vehicle.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-accent">
              <th scope="row" className="pt-2 text-left text-[12pt] font-semibold">
                Grand total, EGP
              </th>
              <td className="pt-2 text-right text-[12pt] font-semibold">{formatAmount(summary.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <p className="mt-6 text-[8pt] text-fg-muted">
        Amounts in Egyptian pounds, calculated to the piaster. Printed from the EGIC Operations Toolkit.
      </p>
    </article>
  )
}
