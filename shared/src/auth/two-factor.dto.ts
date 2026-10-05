import { z } from 'zod'
import { appCodeField, twoFactorCodeField } from './two-factor-code.field.ts'

export const enableTwoFactorSchema = z.object({ code: appCodeField })
export type EnableTwoFactorDto = z.infer<typeof enableTwoFactorSchema>

export const disableTwoFactorSchema = z.object({
  password: z.string('Saisis ton mot de passe.').min(1, 'Saisis ton mot de passe.'),
  code: twoFactorCodeField,
})
export type DisableTwoFactorInput = z.input<typeof disableTwoFactorSchema>
export type DisableTwoFactorDto = z.infer<typeof disableTwoFactorSchema>

// Deuxième étape de la connexion : jeton reçu après le mot de passe + code.
export const loginTwoFactorSchema = z.object({
  challenge: z.string().min(1, 'Reconnecte-toi : la vérification a expiré.'),
  code: twoFactorCodeField,
})
export type LoginTwoFactorInput = z.input<typeof loginTwoFactorSchema>
export type LoginTwoFactorDto = z.infer<typeof loginTwoFactorSchema>

// Clé à ajouter dans l'application (QR code ou saisie manuelle), tant que l'activation n'est pas confirmée.
export interface TwoFactorSetupDto {
  secret: string
  otpauthUrl: string
}

// Codes de secours, affichés une seule fois à l'activation.
export interface RecoveryCodesDto {
  recoveryCodes: string[]
}
