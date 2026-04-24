import type { Request, Response } from 'express';
import { createContactsService, type ContactsService } from '@/modules/contacts/contacts.service';
import {
  contactIdParamSchema,
  createContactSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from '@/modules/contacts/contacts.types';

const defaultService = createContactsService();

export interface ContactsController {
  list(req: Request, res: Response): Promise<void>;
  getById(req: Request, res: Response): Promise<void>;
  create(req: Request, res: Response): Promise<void>;
  update(req: Request, res: Response): Promise<void>;
  remove(req: Request, res: Response): Promise<void>;
}

export function createContactsController(
  service: ContactsService = defaultService,
): ContactsController {
  return {
    async list(req, res) {
      const query = listContactsQuerySchema.parse(req.query);
      const result = await service.list(query);
      res.json(result);
    },

    async getById(req, res) {
      const { id } = contactIdParamSchema.parse(req.params);
      const contact = await service.getById(id);
      res.json(contact);
    },

    async create(req, res) {
      const input = createContactSchema.parse(req.body);
      const contact = await service.create(input);
      res.status(201).json(contact);
    },

    async update(req, res) {
      const { id } = contactIdParamSchema.parse(req.params);
      const patch = updateContactSchema.parse(req.body);
      const contact = await service.update(id, patch);
      res.json(contact);
    },

    async remove(req, res) {
      const { id } = contactIdParamSchema.parse(req.params);
      await service.remove(id);
      res.status(204).send();
    },
  };
}
