import * as yup from 'yup'
import { validationMessages as msg } from '@/shared/validation/messages'

export const requiredString = (label: string) =>
  yup.string().trim().required(msg.required(label))

export const optionalString = () => yup.string().trim().optional()

export const requiredEmail = (label = 'El correo') =>
  yup.string().trim().email(msg.email).required(msg.required(label))

export const optionalEmail = () =>
  yup
    .string()
    .trim()
    .test('email', msg.email, (value) => !value || yup.string().email().isValidSync(value))
    .transform((value) => value || undefined)
    .optional()

export const requiredSelect = (label: string) =>
  yup
    .mixed<string | number>()
    .test('required', msg.requiredFem(label), (value) => value !== '' && value != null)

export const optionalPasswordMin = (min = 6) =>
  yup
    .string()
    .test('min-if-set', msg.minLength('La contraseña', min), (value) => !value || value.length >= min)

export const requiredPasswordMin = (min = 6) =>
  yup
    .string()
    .required(msg.required('La contraseña'))
    .min(min, msg.minLength('La contraseña', min))

export const nonNegativeNumber = () =>
  yup
    .number()
    .typeError(msg.nonNegativeNumber)
    .min(0, msg.nonNegativeNumber)
    .required(msg.required('El valor'))

export const optionalNumber = () =>
  yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional()
