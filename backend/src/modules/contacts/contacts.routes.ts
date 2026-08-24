import { Router } from 'express';
import { asyncHandler } from '@/shared/asyncHandler';
import { createRequireRole } from '@/modules/auth/auth.middleware';
import { createContactsController } from '@/modules/contacts/contacts.controller';

const controller = createContactsController();
const requireAdmin = createRequireRole('admin');

export const contactsRouter: Router = Router();

contactsRouter.get('/', asyncHandler(controller.list));
contactsRouter.post('/', asyncHandler(controller.create));
contactsRouter.get('/:id', asyncHandler(controller.getById));
contactsRouter.patch('/:id', asyncHandler(controller.update));
contactsRouter.delete('/:id', requireAdmin, asyncHandler(controller.remove));
