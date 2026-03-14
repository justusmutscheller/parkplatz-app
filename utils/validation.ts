import { z } from 'zod';

export const phoneSchema = z.string()
  .min(10, 'Telefonnummer zu kurz')
  .max(15, 'Telefonnummer zu lang')
  .regex(/^\+?[0-9]+$/, 'Ungueltige Telefonnummer');

export const smsCodeSchema = z.string()
  .length(6, 'Code muss 6 Stellen haben')
  .regex(/^[0-9]+$/, 'Code darf nur Zahlen enthalten');

export const emailSchema = z.string()
  .email('Ungueltige E-Mail-Adresse');

export const addressSchema = z.object({
  street: z.string().min(1, 'Strasse erforderlich'),
  houseNumber: z.string().min(1, 'Hausnummer erforderlich'),
  postalCode: z.string().min(4, 'PLZ zu kurz').max(10, 'PLZ zu lang'),
  city: z.string().min(1, 'Stadt erforderlich'),
  country: z.string().min(1, 'Land erforderlich'),
});

export const businessInfoSchema = z.object({
  companyName: z.string().min(1, 'Firmenname erforderlich'),
  vatId: z.string().min(1, 'USt-IdNr erforderlich'),
  tradeRegisterNumber: z.string().min(1, 'Handelsregisternummer erforderlich'),
});

export const registrationSchema = z
  .object({
    firstName: z.string().min(1, 'Vorname erforderlich').max(50),
    lastName: z.string().min(1, 'Nachname erforderlich').max(50),
    email: emailSchema,
    dateOfBirth: z.string().min(1, 'Geburtsdatum erforderlich'),
    placeOfBirth: z.string().min(1, 'Geburtsort erforderlich'),
    address: addressSchema,
    accountType: z.enum(['private', 'business']),
    businessInfo: businessInfoSchema.optional(),
  })
  .refine(
    (data) =>
      data.accountType !== 'business' ||
      (data.businessInfo &&
        data.businessInfo.companyName &&
        data.businessInfo.vatId &&
        data.businessInfo.tradeRegisterNumber),
    { message: 'Firmendaten erforderlich für Unternehmenskonto', path: ['businessInfo'] }
  );

export const createListingSchema = z.object({
  title: z.string().min(3, 'Titel zu kurz').max(100),
  description: z.string().min(10, 'Beschreibung zu kurz').max(1000),
  category: z.enum(['garage', 'lot', 'street', 'underground', 'private_spot']),
  totalSpots: z.number().min(1).max(1000),
  pricing: z.array(z.object({
    unit: z.enum(['hour', 'day', 'week', 'month']),
    price: z.number().min(0.01, 'Preis muss groesser als 0 sein'),
    currency: z.string().default('EUR'),
  })).min(1, 'Mindestens eine Preisoption erforderlich'),
});
