import * as yup from 'yup'
import { toTypedSchema } from '@vee-validate/yup'
import type { TypedSchema } from 'vee-validate'
import { optionalEmail, optionalPhone, optionalString, requiredSelect } from '@/shared/validation'
import { validationMessages as msg } from '@/shared/validation/messages'
import { formatoDocumentoError } from '@/shared/validation/documento'

export interface ClienteFormSchemaOptions {
  getTipoDocumentoNombre?: (id: string | number) => string | undefined
  getTipoPersonaNombre?: (id: string | number) => string | undefined
}

const MAX = {
  codigoInterno: 50,
  razonSocial: 200,
  nombres: 150,
  apellido: 150,
  direccion: 250,
  referencia: 250,
  email: 150,
} as const

const normalizeCatalogName = (name?: string) => name?.trim().toUpperCase()

const isPersonaJuridica = (name?: string) => {
  const normalized = normalizeCatalogName(name)
  return normalized?.includes('JURID') ?? false
}

const isPersonaNatural = (name?: string) => {
  const normalized = normalizeCatalogName(name)
  return normalized?.includes('NATURAL') ?? false
}

export function createClienteFormSchema(options: ClienteFormSchemaOptions = {}) {
  const { getTipoDocumentoNombre, getTipoPersonaNombre } = options

  return yup
    .object({
      idTipoDocumento: requiredSelect('El tipo de documento'),
      numeroDocumento: yup
        .string()
        .trim()
        .test('required-documento', msg.required('El número de documento'), function (value) {
          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          if (tipo === 'VSD') return true
          return !!value
        })
        .test('formato-documento', function (value) {
          if (!value) return true

          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          const error = formatoDocumentoError(tipo, value)

          return error ? this.createError({ message: error }) : true
        }),
      codigoInterno: optionalString().max(
        MAX.codigoInterno,
        msg.maxLength('El código interno', MAX.codigoInterno),
      ),
      idTipoCliente: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .test('required-tipo-cliente', msg.required('El tipo de cliente'), function (value) {
          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          if (tipo === 'VSD') return true
          return value != null
        }),
      idTipoPersona: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .test('required-tipo-persona', msg.required('El tipo de persona'), function (value) {
          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          if (tipo === 'VSD') return true
          return value != null
        }),
      razonSocial: optionalString()
        .max(MAX.razonSocial, msg.maxLength('La razón social', MAX.razonSocial))
        .test('required-ruc', msg.razonSocialRequeridaRuc, function (value) {
          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          if (tipo === 'RUC' && !value?.trim()) return false
          return true
        }),
      nombreComercial: optionalString(),
      nombres: optionalString()
        .max(MAX.nombres, msg.maxLength('Los nombres', MAX.nombres))
        .test('required-vsd', msg.required('El nombre'), function (value) {
          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          if (tipo === 'VSD' && !value?.trim()) return false
          return true
        }),
      apellidoPaterno: optionalString().max(
        MAX.apellido,
        msg.maxLength('El apellido paterno', MAX.apellido),
      ),
      apellidoMaterno: optionalString().max(
        MAX.apellido,
        msg.maxLength('El apellido materno', MAX.apellido),
      ),
      telefono: optionalPhone(),
      email: optionalEmail().max(MAX.email, msg.maxLength('El correo', MAX.email)),
      direccion: optionalString().max(MAX.direccion, msg.maxLength('La dirección', MAX.direccion)),
      referencia: optionalString().max(
        MAX.referencia,
        msg.maxLength('La referencia', MAX.referencia),
      ),
      idDistrito: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .optional(),
      observacion: optionalString(),
    })
    .test('identificacion-cliente', function (values) {
      const tipoDocumento = normalizeCatalogName(
        getTipoDocumentoNombre?.(values.idTipoDocumento ?? ''),
      )
      const idTipoPersona = values.idTipoPersona
      const tipoPersona =
        idTipoPersona != null
          ? normalizeCatalogName(getTipoPersonaNombre?.(idTipoPersona))
          : undefined
      const razonSocial = values.razonSocial?.trim()
      const nombres = values.nombres?.trim()

      if (tipoDocumento === 'RUC' || isPersonaJuridica(tipoPersona)) {
        if (!razonSocial) {
          return this.createError({ path: 'razonSocial', message: msg.razonSocialRequerida })
        }
        return true
      }

      if (tipoDocumento === 'DNI' || tipoDocumento === 'VSD' || isPersonaNatural(tipoPersona)) {
        if (!nombres) {
          return this.createError({ path: 'nombres', message: msg.nombresRequeridos })
        }
        return true
      }

      if (!razonSocial && !nombres) {
        return this.createError({ path: 'nombres', message: msg.identificacionCliente })
      }

      return true
    })
}

export function toClienteFormSchema(options?: ClienteFormSchemaOptions): TypedSchema {
  return toTypedSchema(createClienteFormSchema(options))
}
