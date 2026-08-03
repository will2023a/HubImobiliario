import React from 'react'
import { Input } from './Input'
import { maskCNPJ, maskCPF, maskPhone, maskCEP, maskRG } from '../../utils/masks'

const maskFunctions = {
  cnpj: maskCNPJ,
  cpf: maskCPF,
  phone: maskPhone,
  cep: maskCEP,
  rg: maskRG,
}

const placeholders = {
  cnpj: '00.000.000/0000-00',
  cpf: '000.000.000-00',
  phone: '(00) 00000-0000',
  cep: '00000-000',
  rg: '00.000.000-0',
}

export default function MaskedInput({ mask, value, onChange, placeholder, ...props }) {
  const maskFn = maskFunctions[mask]

  function handleChange(e) {
    const rawValue = e.target.value
    const maskedValue = maskFn ? maskFn(rawValue) : rawValue
    // Simulate event with masked value
    onChange({ ...e, target: { ...e.target, value: maskedValue } })
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder || placeholders[mask] || ''}
      {...props}
    />
  )
}
