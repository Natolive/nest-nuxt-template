import { z } from 'zod'

// Code à 6 chiffres de l'application d'authentification, ou code de secours « XXXX-XXXX » ; espaces ignorés, majuscules.
export const twoFactorCodeField = z
  .string('Saisis le code de ton application.')
  .transform((v) => v.replace(/\s/g, '').toUpperCase())
  .refine((v) => /^\d{6}$/.test(v) || /^[A-Z2-7]{4}-?[A-Z2-7]{4}$/.test(v), 'Saisis les 6 chiffres affichés par ton application, ou un code de secours (ex. ABCD-EFGH).')

// Activation : seul un code de l'application prouve que le QR code a bien été scanné.
export const appCodeField = z
  .string('Saisis le code de ton application.')
  .transform((v) => v.replace(/\s/g, ''))
  .refine((v) => /^\d{6}$/.test(v), 'Saisis les 6 chiffres affichés par ton application.')
