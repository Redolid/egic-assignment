import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { CheckIcon, PlusIcon } from '../../../components/ui/Icons'
import { TextField } from '../../../components/ui/TextField'
import { shake } from '../../../lib/motion'
import { validateName, validatePrice, validateQuantity } from '../lib/validation'
import type { ProductInput } from '../types'

interface AddProductFormProps {
  carName: string
  onAdd: (input: ProductInput) => void
}

const emptyForm = { name: '', quantity: '1', unitPrice: '' }
type FormValues = typeof emptyForm

function validateForm(values: FormValues) {
  const name = validateName(values.name)
  const quantity = validateQuantity(values.quantity)
  const unitPrice = validatePrice(values.unitPrice)

  const errors = {
    name: name.ok ? null : name.error,
    quantity: quantity.ok ? null : quantity.error,
    unitPrice: unitPrice.ok ? null : unitPrice.error,
  }
  const input: ProductInput | null =
    name.ok && quantity.ok && unitPrice.ok
      ? { name: name.value, quantity: quantity.value, unitPrice: unitPrice.value }
      : null

  return { errors, input }
}

export function AddProductForm({ carName, onAdd }: AddProductFormProps) {
  const [values, setValues] = useState<FormValues>(emptyForm)
  // Errors only appear after the first submit attempt, then update as the user types.
  const [submitted, setSubmitted] = useState(false)
  const [rejections, setRejections] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const { errors, input } = validateForm(values)
  const visibleErrors = submitted ? errors : { name: null, quantity: null, unitPrice: null }

  // A rejected submit shakes exactly the fields that are wrong and moves focus to the first one.
  useEffect(() => {
    if (!rejections || !formRef.current) return
    const invalid = formRef.current.querySelectorAll<HTMLInputElement>('input[aria-invalid="true"]')
    invalid.forEach((field) => shake(field))
    invalid[0]?.focus()
  }, [rejections])

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), 1400)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  const setField = (field: keyof FormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!input) {
      setRejections((count) => count + 1)
      return
    }

    onAdd(input)
    setValues(emptyForm)
    setSubmitted(false)
    setJustAdded(true)
    nameRef.current?.focus()
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Add a product to ${carName}`}
      className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 sm:grid-cols-[minmax(0,1fr)_7rem_9rem_auto] sm:items-start"
    >
      <TextField
        ref={nameRef}
        label="Product name"
        placeholder="e.g. Oil Filter"
        value={values.name}
        error={visibleErrors.name}
        onChange={(event) => setField('name')(event.target.value)}
        className="col-span-2 sm:col-span-1"
      />
      <TextField
        label="Quantity"
        inputMode="numeric"
        value={values.quantity}
        error={visibleErrors.quantity}
        onChange={(event) => setField('quantity')(event.target.value)}
      />
      <TextField
        label="Unit price (EGP)"
        inputMode="decimal"
        placeholder="0.00"
        value={values.unitPrice}
        error={visibleErrors.unitPrice}
        onChange={(event) => setField('unitPrice')(event.target.value)}
      />
      <Button
        type="submit"
        className={`col-span-2 justify-center overflow-hidden sm:col-span-1 sm:mt-5 ${justAdded ? 'bg-emerald-600!' : ''}`}
      >
        {/* The plus turns into a check for a moment: the add was accepted. */}
        <span className="relative grid h-4 w-4 place-items-center">
          <PlusIcon
            width={16}
            height={16}
            className={`absolute transition-[rotate,scale,opacity] duration-300 ease-[var(--ease-out)] ${
              justAdded ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <CheckIcon
            width={16}
            height={16}
            className={`absolute transition-[scale,opacity] duration-300 ease-[var(--ease-out)] ${
              justAdded ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          />
        </span>
        <span aria-live="polite">{justAdded ? 'Added' : 'Add product'}</span>
      </Button>
    </form>
  )
}
