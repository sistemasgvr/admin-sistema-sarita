export const validationMessages = {
  required: (field: string) => `${field} es obligatorio`,
  requiredFem: (field: string) => `${field} es obligatoria`,
  minLength: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
  maxLength: (field: string, max: number) => `${field} no puede superar ${max} caracteres`,
  email: 'Ingresa un correo válido',
  nonNegativeNumber: 'Ingresa un número válido mayor o igual a 0',
  documentDni: 'El DNI debe tener 8 dígitos numéricos',
  documentRuc: 'El RUC debe tener 11 dígitos numéricos',
  identificacionCliente: 'Indica razón social o nombres del cliente',
  razonSocialRequerida: 'La razón social es obligatoria para personas jurídicas',
  razonSocialRequeridaRuc: 'La razón social es obligatoria para RUC',
  nombresRequeridos: 'Los nombres son obligatorios para personas naturales',
} as const
