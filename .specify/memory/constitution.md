<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.0.0 → 1.1.0

  Modified Principles: N/A

  Added Sections:
  - VI. Data Sync Architecture Pattern (MANDATORY) - Standardized architecture for all data operations with sync

  Removed Sections: N/A

  Rationale:
  After completing the User entity refactoring (REFACTOR_PLAN.md), we established a proven
  architecture pattern that eliminates "código chorizo" and ensures consistent bidirectional
  sync. This pattern is now MANDATORY for all entities requiring synchronization to ensure:
  - Consistent code quality across features
  - Maintainable and testable codebase
  - Reliable bidirectional sync (local ↔ Firebase)
  - Clear separation of concerns (Repository → Mapper → Service → SyncQueue → SyncService)

  Templates Requiring Updates:
  - ⚠️ .specify/templates/plan-template.md - Should include architecture pattern compliance check
  - ⚠️ .specify/templates/spec-template.md - Should reference sync architecture requirements
  - ⚠️ Code Review Checklist - Add verification of Data Sync Architecture Pattern compliance

  Follow-up TODOs:
  - Update code review checklist to include architecture pattern verification
  - Document migration guide for existing entities that don't follow the pattern
  - Create architecture decision record (ADR) detailing the pattern selection rationale
-->

# Gestión de Producción de Huevos - Constitution

## Core Principles

### I. Offline-First Architecture

**Rule**: The application MUST function fully without network connectivity. All user workflows MUST be completable offline, with synchronization happening transparently when connectivity is restored.

**Requirements**:
- Local data persistence MUST be the primary source of truth
- All CRUD operations MUST complete instantly using local storage
- Network operations MUST be asynchronous and non-blocking
- Conflict resolution strategies MUST be defined for all synchronized entities
- Users MUST receive clear visual feedback about sync status (synced, pending, conflict)
- The application MUST queue failed operations and retry automatically

**Rationale**: The agricultural production environment often has unreliable or no internet connectivity. Users must be able to record daily production, manage inventory, and access critical information regardless of network status. Offline-first ensures the app is always usable and data is never lost.

### II. Feature-Based Organization

**Rule**: Code MUST be organized by feature/domain, not by technical layer. Each feature MUST be a self-contained module with its own models, services, UI components, and tests.

**Requirements**:
- Directory structure MUST follow: `src/features/[feature-name]/`
- Each feature folder MUST contain:
  - `models/` - Data models and entities
  - `services/` - Business logic and data access
  - `ui/` or `components/` - User interface components
  - `tests/` - Feature-specific tests
- Shared utilities MUST live in `src/shared/` or `src/core/`
- Features MUST communicate through well-defined interfaces/contracts
- Cross-feature dependencies MUST be minimized and explicitly documented
- Each feature SHOULD be independently testable and potentially extractable

**Rationale**: Feature-based organization improves maintainability by co-locating related code. It makes it easier to understand a complete feature's implementation, reduces cognitive overhead when working on a specific domain area, and enables parallel development by different team members without merge conflicts.

### III. Simplicity-First UX

**Rule**: User experience MUST prioritize simplicity and speed over feature richness. Every interaction MUST be optimized to minimize steps and cognitive load for agricultural workers.

**Requirements**:
- Most common tasks MUST be completable in ≤3 taps/clicks
- Forms MUST use smart defaults based on historical data
- Input methods MUST be optimized for field use (large touch targets, minimal typing)
- Visual feedback MUST be immediate and unambiguous
- Error messages MUST be in plain language with clear recovery steps
- Navigation MUST be intuitive with a shallow hierarchy (≤3 levels deep)
- Features MUST be discoverable without documentation
- Dark patterns and unnecessary confirmations MUST be avoided
- The UI MUST be responsive and feel fast (perceived performance <100ms)

**Rationale**: Agricultural workers need to record data quickly, often in challenging conditions (sunlight, gloves, time pressure). A simple, fast interface reduces friction, increases adoption, and ensures accurate data entry. Complexity leads to errors and abandonment.

### IV. Data Integrity & Synchronization

**Rule**: Data consistency MUST be maintained across offline/online transitions. Conflicts MUST be handled gracefully with user involvement only when necessary.

**Requirements**:
- Timestamps and version vectors MUST be maintained for all records
- Last-write-wins (LWW) strategy MUST be default for simple entities
- Complex conflicts MUST be flagged for user resolution with clear diff views
- Synchronization MUST be incremental and bandwidth-efficient
- Failed syncs MUST be logged with retry mechanisms
- Data validation MUST occur both locally and server-side
- Critical operations (e.g., inventory adjustments) MUST have audit trails

**Rationale**: With multiple users potentially working offline, data conflicts are inevitable. A robust synchronization strategy prevents data loss and ensures the server and all clients eventually converge to a consistent state.

### V. Testing & Quality

**Rule**: Critical user workflows MUST have integration tests. Changes to data synchronization logic MUST include tests for conflict scenarios.

**Requirements**:
- Each feature MUST have at least one integration test covering the primary user story
- Offline-to-online sync MUST be tested for common conflict scenarios
- Data models MUST have contract tests if exposed via API
- UI components for critical workflows MUST have component tests
- Manual testing on actual devices MUST be performed before release
- Performance regressions MUST be caught (e.g., sync time, UI responsiveness)

**Rationale**: The offline-first architecture and synchronization logic are complex. Tests ensure reliability and catch regressions. Given the production/agricultural use case, data integrity bugs can have real business impact.

### VI. Data Sync Architecture Pattern (MANDATORY)

**Rule**: ALL data operations requiring synchronization MUST follow the standardized architecture pattern: Repository → Mapper → Service → SyncQueue → SyncService. This pattern is MANDATORY for any entity that needs to sync between local SQLite and Firebase Firestore.

**Requirements**:

#### 1. Repository Layer (Data Access)
- MUST implement `IRepository<T, CreateData, UpdateData>` interface
- MUST handle ALL direct SQL operations (no SQL outside repositories)
- MUST use parameterized queries to prevent SQL injection
- MUST return domain models (NOT raw database records)
- MUST be injected via Dependency Injection (NO static methods)
- Location: `src/shared/database/repositories/`

Example:
```typescript
export class EntityRepository implements IRepository<Entity, CreateData, UpdateData> {
  constructor(private db: SQLiteDatabase) {}

  async findById(id: string): Promise<Entity | null> { /* ... */ }
  async findAll(): Promise<Entity[]> { /* ... */ }
  async create(data: CreateData): Promise<Entity> { /* ... */ }
  async update(id: string, data: UpdateData): Promise<Entity> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}
```

#### 2. Mapper Layer (Data Transformation)
- MUST centralize ALL transformations between DB (snake_case) and Domain (camelCase)
- MUST have two methods: `toDomain()` and `toPersistence()`
- MUST eliminate duplicate mapping code (DRY principle)
- MUST handle JSON serialization/deserialization
- Location: `src/features/[feature]/mappers/`

Example:
```typescript
export class EntityMapper {
  static toDomain(dbRecord: any): Entity {
    return {
      id: dbRecord.id,
      fieldName: dbRecord.field_name,
      jsonField: JSON.parse(dbRecord.json_field || '[]'),
      // ... all fields
    };
  }

  static toPersistence(entity: Entity): any {
    return {
      id: entity.id,
      field_name: entity.fieldName,
      json_field: JSON.stringify(entity.jsonField),
      // ... all fields
    };
  }
}
```

#### 3. Service Layer (Business Logic)
- MUST use constructor-based Dependency Injection (NO static methods)
- MUST inject `Repository` and `SyncQueue` dependencies
- MUST delegate SQL operations to Repository
- MUST enqueue sync operations after local changes
- MUST use correct entity_type for SyncQueue (plural: 'users', 'production_records')
- MUST return `ServiceResult<T>` with success/error handling
- Location: `src/features/[feature]/services/`

Example:
```typescript
export class EntityService {
  constructor(
    private entityRepository: EntityRepository,
    private syncQueue: SyncQueue
  ) {}

  async createEntity(input: CreateInput): Promise<ServiceResult<Entity>> {
    try {
      const entity = await this.entityRepository.create({
        id: generateId(),
        ...input,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Enqueue for sync (IMPORTANT: plural entity type)
      await this.syncQueue.enqueue({
        entityType: 'entities', // MUST be plural
        entityId: entity.id,
        operation: 'CREATE',
      });

      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: 'Error message' };
    }
  }
}
```

#### 4. Service Provider (Dependency Injection)
- MUST provide factory method for service instantiation
- MUST handle all dependency wiring
- MUST use async initialization for database access
- Location: `src/features/[feature]/services/`

Example:
```typescript
export class EntityServiceProvider {
  static async getEntityService(): Promise<EntityService> {
    const db = await getDatabase();
    const factory = new RepositoryFactory(db);
    const entityRepository = factory.getEntityRepository();
    const syncQueue = new SyncQueue(db);

    return new EntityService(entityRepository, syncQueue);
  }
}
```

#### 5. SyncService Integration (Bidirectional Sync)
- MUST add entity to collections array in `downloadUpdates()`
- MUST implement entity case in `convertToFirestoreFormat()`
- MUST implement entity case in `applyRemoteUpdate()`
- MUST use same entity_type as SyncQueue (plural)
- Location: `src/shared/sync/SyncService.ts`

Example:
```typescript
// 1. Add to collections array
const collections = ['production_records', 'users', 'entities'];

// 2. Implement convertToFirestoreFormat
if (entityType === 'entities') {
  return {
    id: dbRecord.id,
    fieldName: dbRecord.field_name,
    jsonField: JSON.parse(dbRecord.json_field || '[]'),
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

// 3. Implement applyRemoteUpdate
if (entityType === 'entities') {
  await this.db.runAsync(
    `INSERT OR REPLACE INTO entities
     (id, field_name, json_field, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      remoteData.id,
      remoteData.fieldName,
      JSON.stringify(remoteData.jsonField || []),
      remoteData.createdAt,
      remoteData.updatedAt,
    ]
  );
  return;
}
```

#### 6. UI Layer (Custom Hooks)
- MUST separate business logic from UI components
- MUST create focused custom hooks for specific concerns
- MUST use hooks: `useDataManagement`, `useFiltered*`, `useFormActions`, etc.
- MUST use ServiceProvider for service access
- Location: `src/features/[feature]/hooks/`

Example:
```typescript
export const useEntityManagement = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntities = useCallback(async () => {
    try {
      const service = await EntityServiceProvider.getEntityService();
      const allEntities = await service.listAllEntities();
      setEntities(allEntities);
    } catch (error) {
      Alert.alert('Error', 'Could not load entities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  return { entities, loading, loadEntities };
};
```

#### 7. Display Mapper (Optional - UI Presentation)
- SHOULD be created for entities with UI-specific formatting needs
- MUST centralize status/role labels, colors, and display logic
- MUST NOT contain business logic
- Location: `src/features/[feature]/mappers/`

Example:
```typescript
export class EntityDisplayMapper {
  static getStatusLabel(status: EntityStatus): string { /* ... */ }
  static getStatusColor(status: EntityStatus): string { /* ... */ }
  static getEntityDisplayInfo(entity: Entity) { /* ... */ }
}
```

**Rationale**: This standardized pattern eliminates "código chorizo" (spaghetti code) by applying SOLID principles. It ensures:
- **Single Responsibility**: Each layer has one clear purpose
- **Dependency Injection**: Services are testable and decoupled
- **DRY**: Mappers eliminate duplicate transformation code
- **Separation of Concerns**: UI, business logic, and data access are separated
- **Consistent Sync**: All entities follow the same bidirectional sync pattern
- **Maintainability**: Changes are localized to specific layers
- **Testability**: Each component can be unit tested in isolation

**Enforcement**:
- Code reviews MUST verify compliance with this pattern
- New entities MUST NOT use direct SQL in services
- Static service methods MUST be refactored to instance methods with DI
- UI components MUST NOT contain business logic or data transformation
- Any deviation MUST be documented and justified in plan.md

**Reference Implementation**: The User entity (`src/features/auth/`) serves as the canonical example of this pattern.

## Technical Constraints

### Platform & Technology
- Target Platform: Mobile-first (iOS/Android) with optional web interface
- Primary Storage: Local database (SQLite, Realm, or similar)
- Synchronization: RESTful API with incremental sync endpoints
- Offline Queue: Local queue for pending operations with retry logic
- Authentication: Offline-capable with token refresh and cached credentials

### Performance Goals
- UI Response Time: <100ms for all interactions
- Sync Time: <5 seconds for typical daily updates
- App Launch: <2 seconds to ready state
- Data Entry: Average task completion in <30 seconds
- Offline Capacity: Store at least 6 months of production data locally

### Constraints
- Bundle Size: Keep app size <50MB for easy updates on limited connectivity
- Memory: Efficient use on devices with 2GB RAM
- Battery: Minimize background sync impact on battery life
- Storage: Optimize local database size (indexed, pruned old records)

## Development Workflow

### Feature Development Process
1. **Specification**: Create user stories with offline scenarios explicitly defined
2. **Planning**: Design data models with sync strategy and conflict resolution
3. **Implementation**: Build feature following feature-based structure
4. **Testing**: Verify offline functionality, sync scenarios, and UX simplicity
5. **Review**: Check compliance with offline-first and simplicity principles
6. **Deployment**: Ensure backward compatibility for data migrations

### Code Review Checklist
- ✅ Feature works fully offline
- ✅ Sync conflicts are handled appropriately
- ✅ **Data Sync Architecture Pattern compliance** (for entities with sync):
  - ✅ Repository layer implements IRepository (no SQL in services)
  - ✅ Mapper layer centralizes transformations (toDomain/toPersistence)
  - ✅ Service uses Dependency Injection (no static methods)
  - ✅ SyncQueue enqueue after local changes (correct entity_type)
  - ✅ SyncService integration complete (convertToFirestoreFormat + applyRemoteUpdate)
  - ✅ UI uses custom hooks (business logic separated from components)
- ✅ UI follows simplicity-first principles (minimal steps, clear feedback)
- ✅ Code is organized in feature-based structure
- ✅ Tests cover critical paths and offline scenarios
- ✅ Performance meets targets (response time, sync time)
- ✅ No unnecessary complexity or premature abstraction

### Quality Gates
- All integration tests pass
- Manual testing on at least one physical device
- Sync conflict scenarios verified
- No regressions in offline functionality
- UX review confirms simplicity targets met

## Governance

### Amendment Process
1. Proposed changes must be documented with rationale
2. Impact analysis on existing features must be provided
3. Team discussion and consensus required for principle changes
4. Constitution version must be incremented appropriately
5. All templates and dependent documentation must be updated

### Version Policy
- **MAJOR**: Breaking changes to architecture principles (e.g., removing offline-first)
- **MINOR**: New principles added or significant expansions to existing ones
- **PATCH**: Clarifications, wording improvements, non-semantic changes

### Compliance
- All PRs must verify compliance with offline-first, feature-based organization, and simplicity-first UX
- Violations must be justified in the "Complexity Tracking" section of plan.md
- Simplicity must be the default; complexity requires documented justification
- Annual constitution review to ensure principles align with project evolution

### Reference Documents
- Implementation plans must include a "Constitution Check" section
- Feature specifications must address offline scenarios explicitly
- Task lists must organize work by feature boundaries
- Use `.specify/templates/plan-template.md` for implementation planning
- Use `.specify/templates/spec-template.md` for feature specifications
- Use `.specify/templates/tasks-template.md` for task breakdown

**Version**: 1.1.0 | **Ratified**: 2026-01-25 | **Last Amended**: 2026-02-02
