export const validationMessages = {
  required: (field: string) => `${field} es obligatorio`,
  requiredFem: (field: string) => `${field} es obligatoria`,
  minLength: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
  email: 'Ingresa un correo válido',
  nonNegativeNumber: 'Ingresa un número válido mayor o igual a 0',
} as const
