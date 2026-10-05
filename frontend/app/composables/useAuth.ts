import type {
  ChangePasswordDto,
  DeleteAccountDto,
  DisableTwoFactorDto,
  EnableTwoFactorDto,
  ForgotPasswordDto,
  LoginDto,
  LoginResultDto,
  LoginTwoFactorDto,
  Permission,
  RecoveryCodesDto,
  ResetPasswordDto,
  SignupDto,
  TwoFactorSetupDto,
  UpdateProfileDto,
  UserDto,
  VerifyEmailDto,
} from '@socle/shared'

// Compte connecté et tout ce qui passe par /auth : jamais d'appel direct à /auth ailleurs.
export const useAuth = () => {
  // undefined : session pas encore vérifiée ; null : pas connecté.
  const user = useState<UserDto | null | undefined>('auth:user', () => undefined)
  const api = useApi()

  // Droit de la personne connectée (bouton, lien ou page à masquer) ; l'API vérifie de toute façon.
  const can = (permission: Permission) => !!user.value?.permissions.includes(permission)

  async function fetchUser() {
    user.value = await api<UserDto>('/auth/me').catch(() => null)
  }

  // Envoie le lien de confirmation ; le compte reste inactif tant qu'il n'est pas ouvert.
  async function signup(dto: SignupDto) {
    await api('/auth/signup', { method: 'POST', body: dto })
  }

  // Confirme l'email (lien de l'inscription) et connecte.
  async function verifyEmail(dto: VerifyEmailDto) {
    user.value = await api<UserDto>('/auth/verify-email', { method: 'POST', body: dto })
  }

  // Connecté (renvoie null), ou jeton à renvoyer avec le code 2FA (`loginTwoFactor`).
  async function login(credentials: LoginDto): Promise<string | null> {
    const result = await api<LoginResultDto>('/auth/login', { method: 'POST', body: credentials })
    if (result.challenge) return result.challenge
    user.value = result.user
    return null
  }

  async function loginTwoFactor(dto: LoginTwoFactorDto) {
    user.value = (await api<LoginResultDto>('/auth/login/2fa', { method: 'POST', body: dto })).user
  }

  // Même réponse que le compte existe ou non.
  async function forgotPassword(dto: ForgotPasswordDto) {
    await api('/auth/forgot-password', { method: 'POST', body: dto })
  }

  // Nouveau mot de passe depuis le lien reçu ; ne connecte pas (code 2FA demandé à la connexion s'il est actif).
  async function resetPassword(dto: ResetPasswordDto) {
    await api('/auth/reset-password', { method: 'POST', body: dto })
  }

  async function updateProfile(dto: UpdateProfileDto) {
    user.value = await api<UserDto>('/auth/me', { method: 'PATCH', body: dto })
  }

  // Garde cette session, déconnecte les autres.
  async function changePassword(dto: ChangePasswordDto) {
    await api('/auth/me/password', { method: 'POST', body: dto })
  }

  // Double authentification : clé à scanner, puis premier code qui l'active et renvoie les codes de secours (affichés une fois).
  const setupTwoFactor = () => api<TwoFactorSetupDto>('/auth/me/2fa/setup', { method: 'POST' })

  async function enableTwoFactor(dto: EnableTwoFactorDto) {
    const { recoveryCodes } = await api<RecoveryCodesDto>('/auth/me/2fa/enable', { method: 'POST', body: dto })
    await fetchUser()
    return recoveryCodes
  }

  async function disableTwoFactor(dto: DisableTwoFactorDto) {
    await api('/auth/me/2fa/disable', { method: 'POST', body: dto })
    await fetchUser()
  }

  async function deleteAccount(dto: DeleteAccountDto) {
    await api('/auth/me', { method: 'DELETE', body: dto })
    user.value = null
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    user.value = null
  }

  return { user, can, fetchUser, signup, verifyEmail, login, loginTwoFactor, forgotPassword, resetPassword, updateProfile, changePassword, setupTwoFactor, enableTwoFactor, disableTwoFactor, deleteAccount, logout }
}
