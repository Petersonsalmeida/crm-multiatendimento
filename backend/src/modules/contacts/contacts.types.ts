import { z } from 'zod';

// ---------------------------------------------------------------------
// Enums — espelham public.contact_status do schema (0001_init.sql)
// ---------------------------------------------------------------------
export const contactStatusValues = [
  'novo',
  'qualificado',
  'em_negociacao',
  'cliente',
  'perdido',
  'arquivado',
] as const;

export const contactStatusSchema = z.enum(contactStatusValues);
export type ContactStatus = z.infer<typeof contactStatusSchema>;

// ---------------------------------------------------------------------
// Row — formato que vem do Supabase (public.contacts)
// ---------------------------------------------------------------------
export interface ContactRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  status: ContactStatus;
  tags: string[];
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------
// Helpers de validação
// ---------------------------------------------------------------------
// Aceita só dígitos e '+' — normalização fica no service
const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Telefone muito curto')
  .max(20, 'Telefone muito longo')
  .regex(/^[+\d\s()-]+$/, 'Telefone com caracteres inválidos');

const nameSchema = z.string().trim().min(1).max(120);
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20);

// ---------------------------------------------------------------------
// CreateContact — payload de POST /contacts
// ---------------------------------------------------------------------
export const createContactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: z.string().trim().email().optional().nullable(),
  company: z.string().trim().max(120).optional().nullable(),
  status: contactStatusSchema.optional(),
  tags: tagsSchema.optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  source: z.string().trim().max(80).optional().nullable(),
});
export type CreateContactInput = z.infer<typeof createContactSchema>;

// ---------------------------------------------------------------------
// UpdateContact — payload de PATCH /contacts/:id
// ---------------------------------------------------------------------
export const updateContactSchema = createContactSchema
  .partial()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Pelo menos um campo deve ser informado',
  });
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

// ---------------------------------------------------------------------
// ListContactsQuery — query params de GET /contacts
// ---------------------------------------------------------------------
export const listContactsQuerySchema = z.object({
  status: contactStatusSchema.optional(),
  search: z.string().trim().min(1).max(80).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;

// ---------------------------------------------------------------------
// IdParam — validação de :id
// ---------------------------------------------------------------------
export const contactIdParamSchema = z.object({
  id: z.string().uuid('ID de contato inválido'),
});
export type ContactIdParam = z.infer<typeof contactIdParamSchema>;

// ---------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------
export interface PaginatedContacts {
  items: ContactRow[];
  page: number;
  pageSize: number;
  total: number;
}
