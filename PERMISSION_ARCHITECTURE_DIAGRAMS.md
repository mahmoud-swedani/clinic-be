# Permission Architecture Diagrams

## Architecture Flow Diagrams

### Approach 1: Scoped RBAC Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Authenticate   │
                    │   (JWT Token)   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Get User Role   │
                    │  & Permissions  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Check Permission│
                    │  (RBAC Layer)   │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐    ┌─────▼─────┐
              │  Has Perm? │    │   Deny    │
              └─────┬─────┘    └───────────┘
                    │
                    ▼
          ┌─────────────────────┐
          │  Get Permission      │
          │     Scope            │
          └──────────┬──────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐              ┌────▼────┐
   │  'own'  │              │'dept'   │
   └────┬────┘              └────┬────┘
        │                         │
        ▼                         ▼
┌───────────────┐        ┌───────────────┐
│ Build Filter  │        │ Build Filter   │
│ doctor=userId │        │ dept=userDept │
└───────┬───────┘        └───────┬───────┘
        │                        │
        └────────────┬───────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Check Exceptions   │
          │  (Temporary Access) │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Merge Filters      │
          │  (OR Logic)         │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  Execute Query     │
          │  with Filter       │
          └────────────────────┘
```

### Approach 2: ABAC Policy Evaluation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ABAC Policy Engine                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────┐
          │  Extract Subject Attributes       │
          │  - Role: 'طبيب'                  │
          │  - Department: 'dept1'            │
          │  - Branch: 'branch1'               │
          │  - Attributes: {...}               │
          └──────────────┬────────────────────┘
                         │
                         ▼
          ┌───────────────────────────────────┐
          │  Extract Resource Attributes      │
          │  - Type: 'appointment'             │
          │  - Doctor: 'doc123'                │
          │  - Department: 'dept1'             │
          └──────────────┬────────────────────┘
                         │
                         ▼
          ┌───────────────────────────────────┐
          │  Get Applicable Policies          │
          │  (Sorted by Priority)             │
          └──────────────┬────────────────────┘
                         │
                         ▼
          ┌───────────────────────────────────┐
          │  Evaluate Policy 1 (Priority 100)  │
          │  - Check Subject Match            │
          │  - Check Resource Match           │
          │  - Check Action Match             │
          │  - Evaluate Conditions            │
          └──────────────┬────────────────────┘
                         │
              ┌───────────┴───────────┐
              │                       │
         ┌────▼────┐            ┌─────▼─────┐
         │ Matched │            │ Not Match │
         └────┬────┘            └─────┬──────┘
              │                       │
              ▼                       ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ Check Effect    │      │ Next Policy     │
    │ - allow/deny    │      │ (Priority 90)   │
    └────────┬────────┘      └────────┬────────┘
             │                         │
    ┌────────┴────────┐                │
    │                 │                │
┌───▼───┐      ┌──────▼──────┐         │
│ Allow │      │    Deny     │         │
└───┬───┘      └─────────────┘         │
    │                                   │
    ▼                                   │
┌──────────────────────────┐            │
│ Build Filter from Policy │            │
│ Conditions               │            │
└──────────────────────────┘            │
                                         │
                                         ▼
                              ┌──────────────────┐
                              │ Default: Deny     │
                              └──────────────────┘
```

### Approach 3: Hybrid Multi-Layer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Hybrid Permission Evaluation                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Layer 1: Ownership │
                    │  - Check if owner   │
                    │  - Check shared     │
                    │  - Check department │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐        ┌─────▼─────┐
              │   Owner   │        │ Not Owner │
              └─────┬─────┘        └─────┬─────┘
                    │                   │
                    ▼                   ▼
          ┌─────────────────┐   ┌──────────────────┐
          │  Allow (Owner)  │   │  Layer 2: RBAC  │
          └─────────────────┘   │  - Check Perm   │
                                └────────┬────────┘
                                         │
                                ┌────────┴────────┐
                                │                 │
                          ┌─────▼─────┐    ┌─────▼─────┐
                          │ Has Perm?  │    │   Deny    │
                          └─────┬─────┘    └───────────┘
                                │
                                ▼
                      ┌─────────────────────┐
                      │  Layer 3: RBAC Scope│
                      │  - Build scope filter│
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  Layer 4: ABAC Policy│
                      │  - Evaluate policies │
                      │  - Override filter   │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  Layer 5: Exception │
                      │  - Check exceptions  │
                      │  - Temporary access  │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  Merge All Filters  │
                      │  (OR Logic)         │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │  Final Access       │
                      │  Decision + Filter  │
                      └─────────────────────┘
```

## Data Model Relationships

### Scoped RBAC Model Relationships

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │─────────▶│     Role     │─────────▶│ Permission  │
└─────────────┘         └──────────────┘         └──────┬───────┘
      │                                                 │
      │                                                 │
      │                                                 ▼
      │                                         ┌──────────────┐
      │                                         │Permission    │
      │                                         │   Scope      │
      │                                         └──────┬───────┘
      │                                                │
      │                                                │
      ▼                                                ▼
┌─────────────┐                               ┌──────────────┐
│   Access    │                               │   Scope      │
│ Exception   │                               │  Condition   │
└─────────────┘                               └──────────────┘
```

### ABAC Model Relationships

```
┌─────────────┐
│    User     │
│ (Subject)   │
└──────┬──────┘
       │
       │ Attributes: role, dept, branch
       │
       ▼
┌─────────────────┐
│   Policy        │
│   Engine        │
└──────┬──────────┘
       │
       │ Evaluates
       │
       ▼
┌─────────────────┐         ┌──────────────┐
│     Policy      │────────▶│ Policy Rule  │
└─────────────────┘         └──────┬───────┘
                                   │
                                   │ Contains
                                   │
                          ┌────────┴────────┐
                          │                 │
                    ┌─────▼─────┐    ┌─────▼─────┐
                    │  Subject   │    │ Resource  │
                    │  Condition │    │ Condition │
                    └────────────┘    └───────────┘
```

### Hybrid Model Relationships

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │
       ▼
┌─────────────────────────────────────────┐
│      Resource Ownership                 │
│  - owner: User                          │
│  - sharedWith: [SharedAccess]           │
│  - department: Department               │
│  - branch: Branch                       │
└──────┬──────────────────────────────────┘
       │
       │ Owns/Shared
       │
       ▼
┌─────────────┐         ┌──────────────┐
│  Resource   │────────▶│   Resource   │
│  (e.g.      │         │  Ownership   │
│ Appointment)│         └──────────────┘
└─────────────┘
       │
       │ Referenced by
       │
       ▼
┌─────────────────┐
│  Permission     │
│  Evaluation     │
│  (Multi-Layer)  │
└─────────────────┘
```

## Permission Evaluation Sequence

### Scenario: Doctor Viewing Department Appointments

```
Time    Component                    Action
─────────────────────────────────────────────────────────
T0      Client                      GET /api/appointments
        │
T1      Auth Middleware             Verify JWT, Load User
        │
T2      Permission Service          Get User Role & Permissions
        │
T3      Permission Service          Check: hasPermission('appointments.view')
        │                            ✓ Yes
        │
T4      Scope Service               Get Scope for 'appointments.view'
        │                            → 'own'
        │
T5      Context Service             Get User Context
        │                            - role: 'طبيب'
        │                            - department: 'dept1'
        │                            - branch: 'branch1'
        │
T6      Exception Service           Check Department Sharing
        │                            - departmentSharingEnabled: true
        │                            → Override scope to 'department'
        │
T7      Filter Builder              Build MongoDB Filter
        │                            {
        │                              $or: [
        │                                { doctor: 'doc123' },
        │                                { 
        │                                  departmentId: 'dept1',
        │                                  doctor: { $ne: 'doc123' }
        │                                }
        │                              ]
        │                            }
        │
T8      Cache Service               Check Cache
        │                            → Cache Miss
        │
T9      Cache Service               Store in Cache (TTL: 5min)
        │
T10     Appointment Service         Execute Query with Filter
        │                            Appointment.find(filter)
        │
T11     Response                    Return Filtered Results
```

## Data Flow: Exception Grant

```
┌─────────────┐
│   Doctor A  │  Wants to grant access to Doctor B
│  (Owner)    │  for specific appointment
└──────┬──────┘
       │
       │ 1. Request: Share appointment X with Doctor B
       │
       ▼
┌─────────────────┐
│ Permission      │  Check: Can Doctor A share?
│ Service         │  - Is owner? ✓
│                 │  - Has share permission? ✓
└──────┬──────────┘
       │
       │ 2. Create Exception
       │
       ▼
┌─────────────────┐
│ Exception       │  Create AccessException:
│ Service         │  {
│                 │    grantedTo: Doctor B
│                 │    grantedBy: Doctor A
│                 │    resourceType: 'appointment'
│                 │    resourceId: X
│                 │    scope: 'read'
│                 │    expiresAt: +7 days
│                 │  }
└──────┬──────────┘
       │
       │ 3. Store Exception
       │
       ▼
┌─────────────────┐
│   Database      │  Save AccessException
│                 │  (or ResourceOwnership.sharedWith)
└──────┬──────────┘
       │
       │ 4. Invalidate Cache
       │
       ▼
┌─────────────────┐
│  Cache Service  │  Clear cache for:
│                 │  - Doctor B + appointments.view
│                 │  - Appointment X permissions
└─────────────────┘
       │
       │ 5. Notification (Optional)
       │
       ▼
┌─────────────────┐
│ Notification   │  Notify Doctor B of access grant
│ Service        │
└─────────────────┘
```

## Performance Optimization Flow

```
┌─────────────────────────────────────────────────────────┐
│              Permission Check Request                    │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Check Memory Cache   │
            │  (In-Memory Layer)     │
            └───────────┬────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
        ┌───▼───┐              ┌───▼───┐
        │ Hit   │              │ Miss  │
        └───┬───┘              └───┬───┘
            │                      │
            │                      ▼
            │          ┌───────────────────────┐
            │          │  Check Redis Cache    │
            │          │  (Distributed Cache)  │
            │          └───────────┬───────────┘
            │                      │
            │          ┌───────────┴───────────┐
            │          │                       │
            │      ┌───▼───┐              ┌───▼───┐
            │      │ Hit   │              │ Miss  │
            │      └───┬───┘              └───┬───┘
            │          │                      │
            │          │                      ▼
            │          │          ┌───────────────────────┐
            │          │          │  Evaluate Permission  │
            │          │          │  (Database Query)     │
            │          │          └───────────┬───────────┘
            │          │                      │
            │          │                      ▼
            │          │          ┌───────────────────────┐
            │          │          │  Build Filter         │
            │          │          └───────────┬───────────┘
            │          │                      │
            │          │                      ▼
            │          │          ┌───────────────────────┐
            │          │          │  Store in Caches      │
            │          │          │  - Memory (5 min)     │
            │          │          │  - Redis (10 min)     │
            │          │          └───────────┬───────────┘
            │          │                      │
            └──────────┴──────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Return Result       │
            │  (Decision + Filter) │
            └──────────────────────┘
```

## Integration Points

### Rule Engine Integration

```
┌─────────────────┐
│  Permission      │
│  Service        │
└────────┬────────┘
         │
         │ Needs complex rule evaluation
         │
         ▼
┌─────────────────┐
│  Rule Engine    │
│  Adapter        │
└────────┬────────┘
         │
         │ Converts permission rule to Rule Engine format
         │
         ▼
┌─────────────────┐
│  Rule Engine    │
│  (External)     │
└────────┬────────┘
         │
         │ Evaluates rule with context
         │
         ▼
┌─────────────────┐
│  Result         │
│  (boolean +     │
│   filter)       │
└─────────────────┘
```

### Memory Layer Integration

```
┌─────────────────┐
│  Permission     │
│  Service        │
└────────┬────────┘
         │
         │ Get/Set cached data
         │
         ▼
┌─────────────────┐
│  Memory Layer   │
│  Service        │
└────────┬────────┘
         │
         │ Manages cache operations
         │
         ▼
┌─────────────────┐
│  Cache Store    │
│  - In-Memory    │
│  - Redis        │
│  - MongoDB      │
└─────────────────┘
```

### Testing Framework Integration

```
┌─────────────────┐
│  Test Suite     │
│  (Jest/Mocha)   │
└────────┬────────┘
         │
         │ Uses Dynamic Testing Framework
         │
         ▼
┌─────────────────┐
│  Permission     │
│  Test Helper    │
└────────┬────────┘
         │
         │ Creates test scenarios
         │
         ▼
┌─────────────────┐
│  Permission     │
│  Service        │
│  (Test Mode)    │
└────────┬────────┘
         │
         │ Evaluates permissions
         │
         ▼
┌─────────────────┐
│  Assertions     │
│  - Access       │
│  - Filters      │
│  - Exceptions   │
└─────────────────┘
```

---

**End of Diagrams**

