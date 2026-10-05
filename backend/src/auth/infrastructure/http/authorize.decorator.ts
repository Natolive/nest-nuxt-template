import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@socle/shared';
import { AUTHORIZE } from './session.guard.js';

// Réserve une route aux personnes connectées : `@Authorize()` (son propre compte), ou `@Authorize('users.read')`
// pour exiger en plus un droit ; puis `@CurrentUser() user` dans le handler.
export const Authorize = (permission?: Permission) => SetMetadata(AUTHORIZE, { permission });
