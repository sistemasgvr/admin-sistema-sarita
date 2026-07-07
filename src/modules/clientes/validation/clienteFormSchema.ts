import * as yup from 'yup'
import { toTypedSchema } from '@vee-validate/yup'
import type { TypedSchema } from 'vee-validate'
import { optionalEmail, optionalString, requiredSelect, requiredString } from '@/shared/validation'
import { validationMessages as msg } from '@/shared/validation/messages'

export interface ClienteFormSchemaOptions {
  getTipoDocumentoNombre?: (id: string | number) => string | undefined
  getTipoPersonaNombre?: (id: string | number) => string | undefined
}

const MAX = {
  codigoInterno: 50,
  razonSocial: 200,
  nombres: 150,
  apellido: 150,
  numeroDocumento: 20,
  direccion: 250,
  referencia: 250,
  telefono: 20,
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
      numeroDocumento: requiredString('El número de documento')
        .max(MAX.numeroDocumento, msg.maxLength('El número de documento', MAX.numeroDocumento))
        .test('formato-documento', function (value) {
          if (!value) return true

          const tipo = normalizeCatalogName(getTipoDocumentoNombre?.(this.parent.idTipoDocumento))
          const digitsOnly = value.replace(/\D/g, '')

          if (tipo === 'DNI' && !/^\d{8}$/.test(digitsOnly)) {
            return this.createError({ message: msg.documentDni })
          }

          if (tipo === 'RUC' && !/^\d{11}$/.test(digitsOnly)) {
            return this.createError({ message: msg.documentRuc })
          }

          return true
        }),
      codigoInterno: optionalString().max(
        MAX.codigoInterno,
        msg.maxLength('El código interno', MAX.codigoInterno),
      ),
      idTipoCliente: requiredSelect('El tipo de cliente'),
      idTipoPersona: requiredSelect('El tipo de persona'),
      razonSocial: optionalString().max(
        MAX.razonSocial,
        msg.maxLength('La razón social', MAX.razonSocial),
      ),
      nombreComercial: optionalString(),
      nombres: optionalString().max(MAX.nombres, msg.maxLength('Los nombres', MAX.nombres)),
      apellidoPaterno: optionalString().max(
        MAX.apellido,
        msg.maxLength('El apellido paterno', MAX.apellido),
      ),
      apellidoMaterno: optionalString().max(
        MAX.apellido,
        msg.maxLength('El apellido materno', MAX.apellido),
      ),
      telefono: optionalString().max(MAX.telefono, msg.maxLength('El teléfono', MAX.telefono)),
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
      const idTipoPersona = values.idTipoPersona
      const tipoPersona =
        idTipoPersona != null && idTipoPersona !== ''
          ? normalizeCatalogName(getTipoPersonaNombre?.(idTipoPersona))
          : undefined
      const razonSocial = values.razonSocial?.trim()
      const nombres = values.nombres?.trim()

      if (isPersonaJuridica(tipoPersona)) {
        if (!razonSocial) {
          return this.createError({ path: 'razonSocial', message: msg.razonSocialRequerida })
        }
        return true
      }

      if (isPersonaNatural(tipoPersona)) {
        if (!nombres) {
          return this.createError({ path: 'nombres', message: msg.nombresRequeridos })
        }
        return true
      }

      if (!razonSocial && !nombres) {
        return this.createError({ path: 'razonSocial', message: msg.identificacionCliente })
      }

      return true
    })
}

export function toClienteFormSchema(options?: ClienteFormSchemaOptions): TypedSchema {
  return toTypedSchema(createClienteFormSchema(options))
}
