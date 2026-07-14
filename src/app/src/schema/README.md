# Pearl Wishes Studio - Schema Architecture

## 🏗️ Architecture Overview

The application now follows a **Single Source of Truth** pattern where:

1. **Public Website** defines all data models and business logic
2. **Admin Panel** dynamically follows the Public Site schemas
3. **Supabase Database** mirrors the Public Site schema exactly

## 📁 Folder Structure

```
/src
  /schema/              # ⭐ SINGLE SOURCE OF TRUTH
    index.ts            # Central export
    service.schema.ts   # Service data model
    testimonial.schema.ts
    user.schema.ts
    booking.schema.ts
    content.schema.ts
    district.schema.ts
    workshop.schema.ts
    validation.ts       # Shared validation utilities
  
  /lib/db/              # Database layer
    index.ts
    services.ts         # Service CRUD operations
    testimonials.ts     # Testimonial CRUD operations
    users.ts
    bookings.ts
    content.ts
    districts.ts
    workshops.ts
    logger.ts           # Database operation logger
    realtime.ts         # Realtime sync manager
```

## 🎯 Key Principles

### 1. Schema Definitions (`/src/schema/`)

All data models are defined using **TypeScript + Zod** for:
- Type safety
- Runtime validation
- Automatic type inference
- Business rule enforcement

**Example**: `service.schema.ts`

```typescript
import { z } from 'zod';

// Enum for category
export enum ServiceCategory {
  TREATMENT = 'treatment',
  ADD_ON = 'add_on',
}

// Zod schema with validation rules
export const ServiceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  duration: z.number().min(5).max(300),
  price: z.number().min(0).max(1000),
  category: z.nativeEnum(ServiceCategory),
  is_active: z.boolean().default(true),
  // ... more fields
});

// TypeScript type automatically derived
export type Service = z.infer<typeof ServiceSchema>;

// Business rules
export const SERVICE_BUSINESS_RULES = {
  MIN_DURATION: 5,
  MAX_DURATION: 300,
  // ... more rules
} as const;
```

### 2. Database Layer (`/src/lib/db/`)

All database operations go through this centralized layer:
- **Validates** data before insert/update
- **Logs** all operations
- **Enforces** schema compliance
- **Provides** type-safe CRUD functions

**Example**: Using the database layer

```typescript
import { getAllServices, createService } from '@/lib/db/services';
import { ServiceCreate } from '@/schema/service.schema';

// Fetch services (validated automatically)
const services = await getAllServices();

// Create new service (validated before insert)
const newService: ServiceCreate = {
  name: 'New Treatment',
  category: ServiceCategory.TREATMENT,
  duration: 60,
  price: 45.00,
  description: 'A relaxing treatment',
  is_active: true,
};

await createService(newService); // ✅ Validated & logged
```

### 3. Realtime Sync (`/src/lib/db/realtime.ts`)

Changes are synced in realtime between Admin and Public:

```typescript
import { subscribeToServices } from '@/lib/db/realtime';

// Subscribe to service changes
const unsubscribe = subscribeToServices({
  onInsert: (payload) => {
    console.log('New service added:', payload);
    // Refresh UI
  },
  onUpdate: (payload) => {
    console.log('Service updated:', payload);
    // Refresh UI
  },
  onDelete: (payload) => {
    console.log('Service deleted:', payload);
    // Refresh UI
  },
});

// Cleanup
return () => unsubscribe();
```

### 4. Admin Panel Integration

The Admin now uses shared schemas:

```typescript
import {
  Service,
  ServiceCategory,
  formatServiceForDisplay,
} from '@/schema/service.schema';
import { getAllServices, updateService } from '@/lib/db/services';

// Load services with validation
const services = await getAllServices();

// Format for display
const displayServices = services.map(formatServiceForDisplay);

// Update service (validated automatically)
await updateService({
  id: serviceId,
  price: 50.00,
  // ... other fields
});
```

## 🔄 Data Flow

```
┌─────────────────┐
│  Public Website │ ← Defines schemas & business logic
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  /src/schema/   │ ← Single source of truth
└────────┬────────┘
         │
         ├──────────→ ┌──────────────┐
         │            │ Admin Panel  │ ← Imports schemas
         │            └──────────────┘
         │
         ├──────────→ ┌──────────────┐
         │            │ /lib/db/     │ ← Enforces schemas
         │            └──────────────┘
         │
         ↓
┌─────────────────┐
│    Supabase     │ ← Mirrors schema structure
└─────────────────┘
```

## ✅ Benefits

1. **No Duplication**: Types defined once, used everywhere
2. **Type Safety**: Compile-time and runtime validation
3. **Consistency**: Same data structure across all layers
4. **Maintainability**: Change schema once, updates everywhere
5. **Debugging**: Centralized logging for all DB operations
6. **Realtime**: Instant sync between Public and Admin
7. **Validation**: Business rules enforced at the schema level

## 📊 Schema Versioning

Schema version is tracked in `/src/schema/validation.ts`:

```typescript
export const SCHEMA_VERSION = '1.0.0';
export const SCHEMA_LAST_UPDATED = '2026-02-23T00:00:00Z';
```

## 🛠️ Available Schemas

| Schema | File | Description |
|--------|------|-------------|
| `Service` | `service.schema.ts` | Nail treatments & add-ons |
| `Testimonial` | `testimonial.schema.ts` | Client reviews |
| `User` | `user.schema.ts` | Clients, admins, technicians |
| `Booking` | `booking.schema.ts` | Appointments |
| `ContentSection` | `content.schema.ts` | Website content blocks |
| `District` | `district.schema.ts` | Service areas in London |
| `Workshop` | `workshop.schema.ts` | Training workshops |

## 🔍 Database Logger

All database operations are logged:

```typescript
import { dbLogger } from '@/lib/db/logger';

// View logs
dbLogger.getLogs(); // All logs
dbLogger.getLogs(LogLevel.ERROR); // Only errors

// Clear logs
dbLogger.clearLogs();
```

## 🚀 Usage Examples

### Creating a New Entity

1. Define schema in `/src/schema/new-entity.schema.ts`
2. Create database functions in `/src/lib/db/new-entity.ts`
3. Export from `/src/schema/index.ts` and `/src/lib/db/index.ts`
4. Use in Admin and Public components

### Updating Business Rules

1. Edit the schema file (e.g., `/src/schema/service.schema.ts`)
2. Update the Zod schema validation rules
3. Changes automatically enforced everywhere

### Adding Validation

```typescript
// In schema file
export const ServiceSchema = z.object({
  price: z.number()
    .min(0, 'Price must be positive')
    .max(1000, 'Price cannot exceed £1000')
    .refine((val) => val % 5 === 0, {
      message: 'Price must be a multiple of £5',
    }),
});
```

## 🎉 Result

- **Public creates** data → Admin reflects immediately
- **Admin edits** data → Public updates immediately
- **No hardcoded** data anywhere
- **No duplicated** types
- **One shared** schema controlling everything

---

**Schema Version**: 1.0.0  
**Last Updated**: 2026-02-23
