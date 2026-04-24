import { Router } from 'express';
import { asyncHandler } from '@/shared/asyncHandler';
import { createContactsController } from '@/modules/contacts/contacts.controller';

const controller = createContactsController();

export const contactsRouter: Router = Router();

contactsRouter.get('/', asyncHandler(controller.list));
contactsRouter.post('/', asyncHandler(controller.create));
contactsRouter.get('/:id', asyncHandler(controller.getById));
contactsRouter.patch('/:id', asyncHandler(controller.update));
contactsRouter.delete('/:id', asyncHandler(controller.remove));
