# Dynamic Permission Architecture Analysis & Design Report

## Executive Summary

This report analyzes the current Role-Based Access Control (RBAC) system in the Clinic Management Platform and proposes three scalable, context-aware permission architectures that support dynamic visibility rules without hardcoding access logic.

---

## 1️⃣ System Understanding

### 1.1 Current RBAC Implementation

#### **Roles Structure**
The system currently implements a **static RBAC model** with 5 predefined roles:

| Role (Arabic) | Role (English) | Description |
|--------------|----------------|-------------|
| مالك | Owner | Full system access |
| مدير | Manager | Comprehensive management |
| طبيب | Doctor | Treatment and patient management |
| محاسب | Accountant | Financial records management |
| سكرتير | Secretary | Appointments and basic operations |

#### **Permissions Model**
- **39+ permissions** stored in database (`Permission` model)
- Permissions organized by **categories**: `patients`, `appointments`, `financial`, `treatment-stages`, etc.
- **Role-Permission mapping** via `RolePermission` junction table
- Permission format: `{resource}.{action}` (e.g., `patients.view`, `appointments.create`)

#### **Current Data Ownership & Filtering**

**Data Entities and Ownership:**
```
Appointments:
  - doctor: ObjectId (User) ✓
  - patient: ObjectId (Patient)
  - departmentId: ObjectId (Department)

TreatmentStages:
  - doctor: ObjectId (User) ✓
  - patient: ObjectId (Patient)
  - appointment: ObjectId (Appointment)

Payments:
  - receivedBy: ObjectId (User) ✓
  - patient: ObjectId (Patient)
  - invoice: ObjectId (Invoice)

Invoices:
  - createdBy: ObjectId (User) ✓
  - patient: ObjectId (Patient)
  - appointment: ObjectId (Appointment)

Patients:
  - NO direct ownership field ✗
  - Linked via appointments/doctors

FinancialRecords:
  - NO ownership field ✗
  - Branch-level only
```

**Current Filtering Logic:**
- **Hardcoded in services** (e.g., `AppointmentService.getAllAppointments()`)
- Doctors see only their appointments: `filter.doctor = userId`
- Branch filtering for non-owners/managers
- **No dynamic context-aware rules**
- **No exception handling** for temporary access grants

#### **Authorization Service**
- `AuthorizationService.getUserRoleAndPermissions()` - Fetches role and permissions
- `AuthorizationService.hasPermission()` - Checks single permission
- `AuthorizationService.hasAnyPermission()` - Checks multiple permissions
- **No data scope filtering** - Only permission checks

#### **Middleware**
- `protect` - JWT authentication
- `authorizeRoles()` - Role-based route protection
- `authorizePermission()` - Permission-based route protection
- **No data-level filtering middleware**

### 1.2 Identified Limitations

1. **Hardcoded Access Rules**: Filtering logic scattered across services
2. **No Context Awareness**: Cannot handle department-wide, shared secretary, or temporary access
3. **Missing Ownership**: Patients and FinancialRecords lack ownership tracking
4. **No Exception System**: Cannot grant temporary access to another doctor's data
5. **No Rule Engine Integration**: Cannot define dynamic rules
6. **Performance**: No caching of permission checks or precompiled filters
7. **Testing**: No automated testing framework for permission scenarios

---

## 2️⃣ Proposed Permission Architecture Approaches

### **Approach 1: Scoped RBAC with Dynamic Context Rules**

#### **Concept**
Extends traditional RBAC with **data scopes** and **context-aware rules**. Each permission can have multiple scopes (own, department, branch, all), and rules are evaluated dynamically based on context.

#### **Architecture Components**

```
┌─────────────────────────────────────────────────────────┐
│              Permission Evaluation Layer                 │
├─────────────────────────────────────────────────────────┤
│  User → Role → Permissions → Scope Rules → Data Filter │
└─────────────────────────────────────────────────────────┘
```

**Core Models:**

```typescript
// Permission Scope Model
interface PermissionScope {
  permission: ObjectId;           // Reference to Permission
  scope: 'own' | 'department' | 'branch' | 'all';
  conditions?: ScopeCondition[];   // Dynamic conditions
}

// Scope Condition (Rule-based)
interface ScopeCondition {
  field: string;                  // e.g., 'doctor', 'departmentId'
  operator: 'equals' | 'in' | 'notIn' | 'exists';
  value: any;
  context?: 'user' | 'department' | 'branch';
}

// Access Exception (Temporary grants)
interface AccessException {
  grantedTo: ObjectId;            // User receiving access
  grantedBy: ObjectId;            // User granting access
  resourceType: string;           // 'appointment', 'patient', etc.
  resourceId?: ObjectId;          // Specific resource or null for all
  scope: 'read' | 'write' | 'full';
  expiresAt?: Date;
  reason?: string;
}
```

**Data Filtering Service:**

```typescript
class ScopedPermissionService {
  /**
   * Build MongoDB filter based on user, permission, and context
   */
  async buildDataFilter(
    userId: string,
    permission: string,
    resourceType: string,
    context?: RequestContext
  ): Promise<MongoFilter> {
    // 1. Get user's role and permissions
    const userData = await AuthorizationService.getUserRoleAndPermissions(userId);
    
    // 2. Get permission scope rules
    const scopeRules = await PermissionScope.find({ 
      permission: permissionId 
    });
    
    // 3. Check for exceptions
    const exceptions = await AccessException.find({
      grantedTo: userId,
      resourceType,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });
    
    // 4. Build filter
    const filter: MongoFilter = {};
    
    // Apply scope rules
    for (const rule of scopeRules) {
      if (rule.scope === 'own') {
        filter[this.getOwnershipField(resourceType)] = userId;
      } else if (rule.scope === 'department') {
        const userDept = await this.getUserDepartment(userId);
        filter.departmentId = userDept;
      } else if (rule.scope === 'branch') {
        filter.branch = userData.user.branch;
      } else if (rule.scope === 'all') {
        // No filter - full access
      }
      
      // Apply conditions
      if (rule.conditions) {
        Object.assign(filter, this.buildConditionFilter(rule.conditions, context));
      }
    }
    
    // 5. Apply exceptions (union with existing filter)
    if (exceptions.length > 0) {
      const exceptionFilter = {
        $or: [
          filter,
          ...exceptions.map(e => ({ _id: e.resourceId }))
        ]
      };
      return exceptionFilter;
    }
    
    return filter;
  }
}
```

**Integration with Rule Engine:**

```typescript
// Rule Engine Integration
class RuleEnginePermissionAdapter {
  /**
   * Evaluate permission rules using Rule Engine
   */
  async evaluatePermissionRule(
    ruleId: string,
    context: PermissionContext
  ): Promise<boolean> {
    const rule = await RuleEngine.getRule(ruleId);
    
    // Context includes: user, role, resource, action, department, branch
    const result = await RuleEngine.evaluate(rule, {
      user: context.user,
      role: context.role,
      resource: context.resource,
      action: context.action,
      department: context.department,
      branch: context.branch,
      time: new Date(),
    });
    
    return result;
  }
}
```

**Memory Layer Integration:**

```typescript
// Permission Cache Service
class PermissionCacheService {
  private cache = new Map<string, CachedPermission>();
  
  async getCachedFilter(
    userId: string,
    permission: string,
    resourceType: string
  ): Promise<MongoFilter | null> {
    const key = `${userId}:${permission}:${resourceType}`;
    const cached = this.cache.get(key);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.filter;
    }
    
    // Build and cache
    const filter = await ScopedPermissionService.buildDataFilter(...);
    this.cache.set(key, {
      filter,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 min TTL
    });
    
    return filter;
  }
}
```

**Usage Example:**

```typescript
// In AppointmentService
static async getAllAppointments(page: number, limit: number, user: any) {
  // Instead of hardcoded filter
  const filter = await ScopedPermissionService.buildDataFilter(
    user._id,
    'appointments.view',
    'appointment',
    { user, request: req }
  );
  
  return Appointment.find(filter)
    .populate(...)
    .skip(skip)
    .limit(limit);
}
```

#### **Advantages**
- ✅ **Flexible**: Supports multiple scopes per permission
- ✅ **Context-Aware**: Can evaluate rules based on request context
- ✅ **Exception Support**: Temporary access grants
- ✅ **Cachable**: Permission filters can be cached
- ✅ **Backward Compatible**: Works with existing RBAC

#### **Trade-offs**
- ⚠️ **Complexity**: More models and services to maintain
- ⚠️ **Performance**: Rule evaluation adds overhead (mitigated by caching)
- ⚠️ **Database Queries**: Additional queries for scope rules and exceptions

---

### **Approach 2: Attribute-Based Access Control (ABAC)**

#### **Concept**
Uses **attributes** (user, resource, environment) to make access decisions. Rules are defined as policies that evaluate attributes dynamically.

#### **Architecture Components**

```
┌─────────────────────────────────────────────────────────┐
│                    Policy Engine                        │
├─────────────────────────────────────────────────────────┤
│  Subject Attributes → Policy Rules → Decision → Filter  │
└─────────────────────────────────────────────────────────┘
```

**Core Models:**

```typescript
// Policy Model
interface Policy {
  name: string;
  description: string;
  effect: 'allow' | 'deny';
  rules: PolicyRule[];
  priority: number;              // Higher priority evaluated first
  conditions?: PolicyCondition[];
}

// Policy Rule
interface PolicyRule {
  subject: {
    roles?: string[];
    departments?: string[];
    branches?: string[];
    attributes?: Record<string, any>;
  };
  resource: {
    type: string;
    attributes?: Record<string, any>;
  };
  action: string[];
  conditions?: PolicyCondition[];
}

// Policy Condition (Dynamic evaluation)
interface PolicyCondition {
  attribute: string;            // e.g., 'resource.doctor', 'subject.id'
  operator: 'equals' | 'in' | 'notIn' | 'exists' | 'gt' | 'lt';
  value: any;
  logic?: 'AND' | 'OR';
}

// Access Policy Assignment
interface PolicyAssignment {
  policy: ObjectId;
  resourceType: string;
  isActive: boolean;
  createdAt: Date;
}
```

**Policy Evaluation Service:**

```typescript
class ABACPolicyEngine {
  /**
   * Evaluate policies and build data filter
   */
  async evaluateAccess(
    subject: SubjectAttributes,
    resourceType: string,
    action: string,
    context?: RequestContext
  ): Promise<{ allowed: boolean; filter?: MongoFilter }> {
    // 1. Get applicable policies
    const policies = await Policy.find({
      'rules.resource.type': resourceType,
      'rules.action': { $in: [action, '*'] },
      isActive: true
    }).sort({ priority: -1 });
    
    // 2. Evaluate each policy
    for (const policy of policies) {
      const result = await this.evaluatePolicy(policy, subject, resourceType, action, context);
      
      if (result.matched) {
        if (policy.effect === 'deny') {
          return { allowed: false };
        }
        
        // Build filter from policy conditions
        const filter = this.buildFilterFromPolicy(policy, subject, context);
        return { allowed: true, filter };
      }
    }
    
    // Default deny
    return { allowed: false };
  }
  
  private async evaluatePolicy(
    policy: Policy,
    subject: SubjectAttributes,
    resourceType: string,
    action: string,
    context: RequestContext
  ): Promise<{ matched: boolean; conditions?: PolicyCondition[] }> {
    for (const rule of policy.rules) {
      // Check subject attributes
      if (rule.subject.roles && !rule.subject.roles.includes(subject.role)) {
        continue;
      }
      
      if (rule.subject.departments && !rule.subject.departments.includes(subject.department)) {
        continue;
      }
      
      // Check resource type
      if (rule.resource.type !== resourceType && rule.resource.type !== '*') {
        continue;
      }
      
      // Check action
      if (!rule.action.includes(action) && !rule.action.includes('*')) {
        continue;
      }
      
      // Evaluate conditions
      if (rule.conditions) {
        const conditionsMet = await this.evaluateConditions(
          rule.conditions,
          subject,
          context
        );
        if (!conditionsMet) continue;
      }
      
      return { matched: true, conditions: rule.conditions };
    }
    
    return { matched: false };
  }
  
  private buildFilterFromPolicy(
    policy: Policy,
    subject: SubjectAttributes,
    context: RequestContext
  ): MongoFilter {
    const filter: MongoFilter = {};
    
    // Extract filter conditions from policy
    for (const rule of policy.rules) {
      if (rule.conditions) {
        for (const condition of rule.conditions) {
          if (condition.attribute.startsWith('resource.')) {
            const field = condition.attribute.replace('resource.', '');
            
            if (condition.operator === 'equals') {
              if (condition.value === '${subject.id}') {
                filter[field] = subject.id;
              } else if (condition.value === '${subject.department}') {
                filter.departmentId = subject.department;
              } else if (condition.value === '${subject.branch}') {
                filter.branch = subject.branch;
              } else {
                filter[field] = condition.value;
              }
            }
          }
        }
      }
    }
    
    return filter;
  }
}
```

**Example Policies:**

```typescript
// Policy 1: Doctor sees own appointments
{
  name: 'doctor-own-appointments',
  effect: 'allow',
  priority: 100,
  rules: [{
    subject: { roles: ['طبيب'] },
    resource: { type: 'appointment' },
    action: ['view', 'edit'],
    conditions: [{
      attribute: 'resource.doctor',
      operator: 'equals',
      value: '${subject.id}'
    }]
  }]
}

// Policy 2: Doctor sees department appointments (exception)
{
  name: 'doctor-department-appointments',
  effect: 'allow',
  priority: 90,
  rules: [{
    subject: { roles: ['طبيب'] },
    resource: { type: 'appointment' },
    action: ['view'],
    conditions: [{
      attribute: 'resource.departmentId',
      operator: 'equals',
      value: '${subject.department}'
    }, {
      attribute: 'subject.hasDepartmentAccess',
      operator: 'equals',
      value: true
    }]
  }]
}

// Policy 3: Shared secretary access
{
  name: 'shared-secretary-access',
  effect: 'allow',
  priority: 80,
  rules: [{
    subject: { 
      roles: ['سكرتير'],
      attributes: { isSharedSecretary: true }
    },
    resource: { type: '*' },
    action: ['view', 'create', 'edit'],
    conditions: [{
      attribute: 'resource.branch',
      operator: 'equals',
      value: '${subject.branch}'
    }]
  }]
}
```

**Rule Engine Integration:**

```typescript
// ABAC with Rule Engine
class ABACRuleEngineAdapter {
  async evaluatePolicyWithRules(
    policyId: string,
    context: ABACContext
  ): Promise<PolicyEvaluationResult> {
    const policy = await Policy.findById(policyId);
    
    // Convert policy to Rule Engine format
    const ruleExpression = this.policyToRuleExpression(policy);
    
    // Evaluate using Rule Engine
    const result = await RuleEngine.evaluate(ruleExpression, {
      subject: context.subject,
      resource: context.resource,
      action: context.action,
      environment: context.environment,
    });
    
    return {
      allowed: result === true,
      filter: result.filter,
      matchedPolicy: policy.name
    };
  }
}
```

**Memory Layer Integration:**

```typescript
// Policy Cache
class PolicyCacheService {
  private policyCache = new Map<string, CachedPolicy>();
  private evaluationCache = new Map<string, EvaluationResult>();
  
  async getCachedEvaluation(
    subjectId: string,
    resourceType: string,
    action: string
  ): Promise<EvaluationResult | null> {
    const key = `${subjectId}:${resourceType}:${action}`;
    return this.evaluationCache.get(key) || null;
  }
  
  async cacheEvaluation(
    subjectId: string,
    resourceType: string,
    action: string,
    result: EvaluationResult
  ): Promise<void> {
    const key = `${subjectId}:${resourceType}:${action}`;
    this.evaluationCache.set(key, {
      ...result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000
    });
  }
}
```

#### **Advantages**
- ✅ **Highly Flexible**: Can express complex access rules
- ✅ **Attribute-Based**: Decisions based on multiple attributes
- ✅ **Policy-Driven**: Rules defined as data, not code
- ✅ **Scalable**: Easy to add new policies without code changes
- ✅ **Fine-Grained**: Can control access at resource attribute level

#### **Trade-offs**
- ⚠️ **Complexity**: More complex to understand and debug
- ⚠️ **Performance**: Policy evaluation can be expensive (needs caching)
- ⚠️ **Learning Curve**: Team needs to understand ABAC concepts
- ⚠️ **Policy Management**: Requires UI for policy management

---

### **Approach 3: Hybrid Model (RBAC + ABAC + Resource Ownership)**

#### **Concept**
Combines **RBAC permissions**, **ABAC policies**, and **resource ownership** in a layered approach. Uses ownership as the base layer, RBAC for permissions, and ABAC for exceptions and complex rules.

#### **Architecture Components**

```
┌─────────────────────────────────────────────────────────┐
│              Hybrid Permission Engine                    │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Ownership Check                                │
│  Layer 2: RBAC Permission Check                         │
│  Layer 3: ABAC Policy Evaluation                        │
│  Layer 4: Exception Override                            │
└─────────────────────────────────────────────────────────┘
```

**Core Models:**

```typescript
// Resource Ownership Model
interface ResourceOwnership {
  resourceType: string;          // 'appointment', 'patient', etc.
  resourceId: ObjectId;
  owner: ObjectId;                // Primary owner (User)
  sharedWith?: SharedAccess[];   // Shared access list
  department?: ObjectId;          // Department ownership
  branch: ObjectId;               // Branch ownership
  createdAt: Date;
}

// Shared Access
interface SharedAccess {
  user: ObjectId;
  accessLevel: 'read' | 'write' | 'full';
  grantedBy: ObjectId;
  grantedAt: Date;
  expiresAt?: Date;
  reason?: string;
}

// Permission Scope (RBAC Layer)
interface PermissionScope {
  permission: ObjectId;
  defaultScope: 'own' | 'department' | 'branch' | 'all';
  overridePolicies?: ObjectId[];  // ABAC policies that can override
}

// Hybrid Access Rule
interface HybridAccessRule {
  name: string;
  type: 'ownership' | 'rbac' | 'abac' | 'exception';
  priority: number;
  rule: any;                      // Rule definition
  isActive: boolean;
}
```

**Hybrid Permission Service:**

```typescript
class HybridPermissionService {
  /**
   * Multi-layer permission evaluation
   */
  async evaluateAccess(
    userId: string,
    permission: string,
    resourceType: string,
    resourceId?: ObjectId,
    action: string = 'view',
    context?: RequestContext
  ): Promise<AccessDecision> {
    // Layer 1: Ownership Check
    if (resourceId) {
      const ownership = await ResourceOwnership.findOne({
        resourceType,
        resourceId
      });
      
      if (ownership) {
        // Check direct ownership
        if (ownership.owner.toString() === userId) {
          return { allowed: true, reason: 'owner' };
        }
        
        // Check shared access
        const shared = ownership.sharedWith?.find(
          s => s.user.toString() === userId &&
          (!s.expiresAt || s.expiresAt > new Date())
        );
        if (shared && this.hasRequiredAccessLevel(shared.accessLevel, action)) {
          return { allowed: true, reason: 'shared_access' };
        }
        
        // Check department access
        const userDept = await this.getUserDepartment(userId);
        if (ownership.department && ownership.department.toString() === userDept?.toString()) {
          // Proceed to RBAC check
        } else {
          // Not owner, not shared, not same department - check exceptions
          return await this.checkExceptions(userId, resourceType, resourceId);
        }
      }
    }
    
    // Layer 2: RBAC Permission Check
    const hasPermission = await AuthorizationService.hasPermission(userId, permission);
    if (!hasPermission) {
      return { allowed: false, reason: 'no_permission' };
    }
    
    // Layer 3: RBAC Scope Check
    const scope = await this.getPermissionScope(permission);
    const scopeFilter = await this.buildScopeFilter(userId, scope, resourceType, context);
    
    // Layer 4: ABAC Policy Override
    const policyResult = await this.evaluateABACPolicies(
      userId,
      resourceType,
      action,
      context
    );
    
    if (policyResult.allowed && policyResult.filter) {
      // ABAC policy allows access with specific filter
      return {
        allowed: true,
        reason: 'abac_policy',
        filter: policyResult.filter
      };
    }
    
    // Layer 5: Exception Check
    const exception = await this.checkExceptions(userId, resourceType, resourceId);
    if (exception.allowed) {
      return exception;
    }
    
    // Default: Use RBAC scope filter
    return {
      allowed: true,
      reason: 'rbac_scope',
      filter: scopeFilter
    };
  }
  
  /**
   * Build data filter for list queries
   */
  async buildDataFilter(
    userId: string,
    permission: string,
    resourceType: string,
    context?: RequestContext
  ): Promise<MongoFilter> {
    // Get user data
    const userData = await AuthorizationService.getUserRoleAndPermissions(userId);
    
    // Get permission scope
    const scope = await this.getPermissionScope(permission);
    
    // Build base filter from scope
    const baseFilter = await this.buildScopeFilter(userId, scope, resourceType, context);
    
    // Get ownership-based filter (resources user owns or has shared access to)
    const ownershipFilter = await this.buildOwnershipFilter(userId, resourceType);
    
    // Get ABAC policy filter
    const policyFilter = await this.evaluateABACPolicies(
      userId,
      resourceType,
      'view',
      context
    );
    
    // Get exception filter
    const exceptionFilter = await this.buildExceptionFilter(userId, resourceType);
    
    // Combine filters with OR logic
    return {
      $or: [
        baseFilter,
        ownershipFilter,
        policyFilter.filter,
        exceptionFilter
      ].filter(f => f && Object.keys(f).length > 0)
    };
  }
  
  private async buildOwnershipFilter(
    userId: string,
    resourceType: string
  ): Promise<MongoFilter> {
    // Get resources user owns
    const ownedResources = await ResourceOwnership.find({
      resourceType,
      owner: userId
    }).select('resourceId');
    
    // Get resources shared with user
    const sharedResources = await ResourceOwnership.find({
      resourceType,
      'sharedWith.user': userId,
      $or: [
        { 'sharedWith.expiresAt': { $gt: new Date() } },
        { 'sharedWith.expiresAt': null }
      ]
    }).select('resourceId');
    
    const resourceIds = [
      ...ownedResources.map(r => r.resourceId),
      ...sharedResources.map(r => r.resourceId)
    ];
    
    if (resourceIds.length === 0) {
      return {};
    }
    
    return { _id: { $in: resourceIds } };
  }
}
```

**Resource Ownership Service:**

```typescript
class ResourceOwnershipService {
  /**
   * Create ownership record when resource is created
   */
  async createOwnership(
    resourceType: string,
    resourceId: ObjectId,
    ownerId: ObjectId,
    departmentId?: ObjectId,
    branchId: ObjectId
  ): Promise<ResourceOwnership> {
    return ResourceOwnership.create({
      resourceType,
      resourceId,
      owner: ownerId,
      department: departmentId,
      branch: branchId,
    });
  }
  
  /**
   * Share resource with another user
   */
  async shareResource(
    resourceType: string,
    resourceId: ObjectId,
    sharedWithUserId: ObjectId,
    grantedByUserId: ObjectId,
    accessLevel: 'read' | 'write' | 'full',
    expiresAt?: Date,
    reason?: string
  ): Promise<void> {
    const ownership = await ResourceOwnership.findOne({
      resourceType,
      resourceId
    });
    
    if (!ownership) {
      throw new Error('Resource ownership not found');
    }
    
    // Check if grantor has permission to share
    const canShare = await this.canShareResource(
      grantedByUserId,
      resourceType,
      resourceId
    );
    
    if (!canShare) {
      throw new Error('Insufficient permissions to share resource');
    }
    
    // Add or update shared access
    const existingIndex = ownership.sharedWith?.findIndex(
      s => s.user.toString() === sharedWithUserId.toString()
    );
    
    if (existingIndex >= 0) {
      ownership.sharedWith[existingIndex] = {
        user: sharedWithUserId,
        accessLevel,
        grantedBy: grantedByUserId,
        grantedAt: new Date(),
        expiresAt,
        reason
      };
    } else {
      ownership.sharedWith = ownership.sharedWith || [];
      ownership.sharedWith.push({
        user: sharedWithUserId,
        accessLevel,
        grantedBy: grantedByUserId,
        grantedAt: new Date(),
        expiresAt,
        reason
      });
    }
    
    await ownership.save();
  }
}
```

**Integration Points:**

```typescript
// Rule Engine Integration
class HybridRuleEngineAdapter {
  async evaluateHybridRule(
    ruleId: string,
    context: HybridContext
  ): Promise<AccessDecision> {
    const rule = await HybridAccessRule.findById(ruleId);
    
    if (rule.type === 'abac') {
      return await ABACPolicyEngine.evaluateAccess(...);
    } else if (rule.type === 'ownership') {
      return await this.evaluateOwnershipRule(rule, context);
    } else if (rule.type === 'rbac') {
      return await this.evaluateRBACRule(rule, context);
    }
    
    // Use Rule Engine for complex evaluations
    const ruleExpression = await RuleEngine.compile(rule.rule);
    return await RuleEngine.evaluate(ruleExpression, context);
  }
}

// Memory Layer Integration
class HybridPermissionCache {
  async getCachedDecision(
    userId: string,
    permission: string,
    resourceType: string,
    resourceId?: string
  ): Promise<AccessDecision | null> {
    const key = resourceId 
      ? `${userId}:${permission}:${resourceType}:${resourceId}`
      : `${userId}:${permission}:${resourceType}`;
    
    return await MemoryLayer.get(key);
  }
  
  async cacheDecision(
    userId: string,
    permission: string,
    resourceType: string,
    resourceId: string | undefined,
    decision: AccessDecision
  ): Promise<void> {
    const key = resourceId 
      ? `${userId}:${permission}:${resourceType}:${resourceId}`
      : `${userId}:${permission}:${resourceType}`;
    
    await MemoryLayer.set(key, decision, { ttl: 300 }); // 5 min
  }
}
```

#### **Advantages**
- ✅ **Best of All Worlds**: Combines RBAC, ABAC, and ownership
- ✅ **Clear Ownership**: Explicit resource ownership tracking
- ✅ **Flexible Sharing**: Easy to share resources with exceptions
- ✅ **Layered Security**: Multiple layers of access control
- ✅ **Backward Compatible**: Can migrate gradually from current RBAC

#### **Trade-offs**
- ⚠️ **Complexity**: Most complex to implement and maintain
- ⚠️ **Performance**: Multiple layers add overhead (needs aggressive caching)
- ⚠️ **Data Migration**: Requires adding ownership to existing resources
- ⚠️ **Storage**: Additional ownership records increase database size

---

## 3️⃣ Comparison Table

| Feature | Approach 1: Scoped RBAC | Approach 2: ABAC | Approach 3: Hybrid |
|---------|------------------------|------------------|-------------------|
| **Complexity** | Medium | High | Very High |
| **Flexibility** | High | Very High | Very High |
| **Performance** | Good (with caching) | Medium (needs caching) | Medium (needs caching) |
| **Implementation Time** | 2-3 weeks | 3-4 weeks | 4-6 weeks |
| **Maintainability** | Good | Medium | Medium |
| **Learning Curve** | Low | Medium | High |
| **Exception Support** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Context Awareness** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Ownership Tracking** | ⚠️ Partial | ❌ No | ✅ Yes |
| **Rule Engine Integration** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Memory Layer Integration** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Backward Compatibility** | ✅ High | ⚠️ Medium | ✅ High |
| **Scalability** | ✅ Good | ✅ Excellent | ✅ Excellent |
| **Testing Complexity** | Medium | High | Very High |
| **Documentation Needs** | Medium | High | Very High |

---

## 4️⃣ Core Requirements Analysis

### 4.1 Multi-Level Permissions Support

**All approaches support:**
- ✅ User → Role → Context → Data Scope hierarchy
- ✅ Dynamic context evaluation (department, branch, time, etc.)
- ✅ Nested permission checks

**Best Implementation:** Approach 3 (Hybrid) - Explicit ownership layer

### 4.2 Dynamic Exceptions

**All approaches support:**
- ✅ Temporary access grants
- ✅ Time-based expiration
- ✅ Approval workflows (can be added)

**Best Implementation:** Approach 3 (Hybrid) - Built-in sharing mechanism

### 4.3 Rule Engine Compatibility

**All approaches integrate with Rule Engine:**
- ✅ Approach 1: Scope conditions as rules
- ✅ Approach 2: Policies as rules
- ✅ Approach 3: Hybrid rules combining all types

**Example Rule Definition:**
```typescript
// Rule: Doctor can view department appointments if department sharing enabled
{
  name: 'doctor-department-sharing',
  condition: {
    $and: [
      { 'user.role': 'طبيب' },
      { 'user.department': { $exists: true } },
      { 'context.departmentSharingEnabled': true }
    ]
  },
  action: 'allow',
  filter: {
    departmentId: '${user.department}',
    doctor: { $ne: '${user.id}' }
  }
}
```

### 4.4 Performance Optimization

**Caching Strategy (All Approaches):**
```typescript
// Permission filter cache
- Key: `${userId}:${permission}:${resourceType}`
- TTL: 5 minutes
- Invalidation: On role/permission change, on exception grant

// Policy evaluation cache
- Key: `${userId}:${resourceType}:${action}`
- TTL: 5 minutes
- Invalidation: On policy update

// Ownership cache
- Key: `${resourceType}:${resourceId}`
- TTL: 10 minutes
- Invalidation: On ownership/share change
```

**Precompilation:**
- Compile permission rules to MongoDB filters at startup
- Cache compiled filters in Memory Layer
- Refresh on rule changes

### 4.5 Testing Framework Integration

**Test Structure:**
```typescript
// Dynamic Testing Framework Integration
describe('Permission System Tests', () => {
  it('should allow doctor to view own appointments', async () => {
    const doctor = await createUser({ role: 'طبيب' });
    const appointment = await createAppointment({ doctor: doctor._id });
    
    const decision = await PermissionService.evaluateAccess(
      doctor._id,
      'appointments.view',
      'appointment',
      appointment._id
    );
    
    expect(decision.allowed).toBe(true);
  });
  
  it('should allow doctor to view department appointments when shared', async () => {
    const doctor1 = await createUser({ role: 'طبيب', department: dept1 });
    const doctor2 = await createUser({ role: 'طبيب', department: dept1 });
    const appointment = await createAppointment({ doctor: doctor2._id, department: dept1 });
    
    // Enable department sharing
    await enableDepartmentSharing(dept1);
    
    const decision = await PermissionService.evaluateAccess(
      doctor1._id,
      'appointments.view',
      'appointment',
      appointment._id
    );
    
    expect(decision.allowed).toBe(true);
  });
});
```

---

## 5️⃣ Integration Plan

### Phase 1: Foundation (Week 1-2)

**Tasks:**
1. Add ownership fields to existing models (if using Approach 3)
2. Create permission scope models (Approach 1) or policy models (Approach 2)
3. Implement base permission service
4. Add migration scripts for existing data

**Migration Script Example:**
```typescript
// Migrate existing appointments to have ownership
async function migrateAppointmentOwnership() {
  const appointments = await Appointment.find({});
  
  for (const appointment of appointments) {
    await ResourceOwnership.create({
      resourceType: 'appointment',
      resourceId: appointment._id,
      owner: appointment.doctor,
      department: appointment.departmentId,
      branch: await getBranchFromUser(appointment.doctor)
    });
  }
}
```

### Phase 2: Core Implementation (Week 3-4)

**Tasks:**
1. Implement data filtering service
2. Integrate with existing services (replace hardcoded filters)
3. Add exception/sharing mechanism
4. Implement caching layer

**Service Integration:**
```typescript
// Before
static async getAllAppointments(page: number, limit: number, user: any) {
  const filter: any = {};
  if (getUserRoleName(user) === 'طبيب') {
    filter.doctor = user._id;
  }
  return Appointment.find(filter);
}

// After
static async getAllAppointments(page: number, limit: number, user: any) {
  const filter = await PermissionService.buildDataFilter(
    user._id,
    'appointments.view',
    'appointment',
    { user }
  );
  return Appointment.find(filter);
}
```

### Phase 3: Rule Engine Integration (Week 5)

**Tasks:**
1. Create rule engine adapter
2. Define permission rules as Rule Engine rules
3. Test rule evaluation
4. Add rule management UI (if needed)

### Phase 4: Testing & Documentation (Week 6)

**Tasks:**
1. Write comprehensive tests using Dynamic Testing Framework
2. Generate documentation using Auto Documentation Generator
3. Performance testing and optimization
4. Security audit

**Documentation Generation:**
```typescript
// Auto Documentation Generator Integration
@PermissionDoc({
  resource: 'appointment',
  permission: 'appointments.view',
  description: 'View appointments',
  scopes: ['own', 'department', 'branch', 'all'],
  examples: [
    {
      role: 'طبيب',
      scope: 'own',
      filter: { doctor: '${user.id}' }
    }
  ]
})
async buildAppointmentFilter(userId: string, context: RequestContext) {
  // ...
}
```

### Phase 5: Rollout (Week 7+)

**Tasks:**
1. Gradual rollout to production
2. Monitor performance and errors
3. Gather user feedback
4. Iterate and improve

---

## 6️⃣ Best Practices & Recommendations

### 6.1 Security

1. **Principle of Least Privilege**: Default to most restrictive scope
2. **Audit Logging**: Log all permission checks and access grants
3. **Time-Based Expiration**: All exceptions should have expiration
4. **Approval Workflows**: Require approval for sensitive access grants
5. **Regular Reviews**: Periodic review of permissions and exceptions

### 6.2 Performance

1. **Aggressive Caching**: Cache permission filters and decisions
2. **Index Optimization**: Index ownership and shared access fields
3. **Lazy Evaluation**: Evaluate rules only when needed
4. **Batch Operations**: Batch permission checks when possible
5. **Query Optimization**: Use MongoDB aggregation for complex filters

### 6.3 Maintainability

1. **Centralized Logic**: All permission logic in one service
2. **Clear Abstractions**: Separate concerns (RBAC, ABAC, ownership)
3. **Documentation**: Document all permission rules and policies
4. **Versioning**: Version permission rules for rollback capability
5. **Monitoring**: Monitor permission check performance and failures

### 6.4 Modularity

1. **Plugin Architecture**: Allow custom permission evaluators
2. **Rule Extensions**: Easy to add new rule types
3. **Policy Templates**: Reusable policy templates
4. **Service Isolation**: Permission service independent of business logic

---

## 7️⃣ Final Recommendation

### **Recommended Approach: Approach 1 (Scoped RBAC with Dynamic Context Rules)**

#### **Reasoning:**

1. **Balanced Complexity**: Provides flexibility without excessive complexity
2. **Backward Compatible**: Easiest migration from current system
3. **Performance**: Good performance with caching
4. **Team Familiarity**: Team already understands RBAC concepts
5. **Incremental Enhancement**: Can evolve to Approach 3 later if needed

#### **Implementation Priority:**

1. **Start with Approach 1** for core functionality
2. **Add ownership tracking** (from Approach 3) for explicit resource ownership
3. **Integrate ABAC policies** (from Approach 2) for complex exceptions
4. **Evolve to Hybrid Model** if requirements become more complex

#### **Migration Path:**

```
Current System (Static RBAC)
    ↓
Approach 1: Scoped RBAC (Add scopes and exceptions)
    ↓
Add Ownership Layer (Explicit resource ownership)
    ↓
Add ABAC Policies (Complex rule support)
    ↓
Hybrid Model (Full feature set)
```

---

## 8️⃣ Next Steps

1. **Review and Approve**: Review this report with stakeholders
2. **Choose Approach**: Decide on approach (recommended: Approach 1)
3. **Create Detailed Spec**: Create detailed technical specification
4. **Set Up Development Environment**: Prepare for implementation
5. **Begin Phase 1**: Start with foundation work

---

## Appendix A: Data Models Schema

### A.1 Scoped RBAC Models

```typescript
// PermissionScope Schema
{
  permission: ObjectId (ref: Permission),
  scope: String (enum: ['own', 'department', 'branch', 'all']),
  conditions: [{
    field: String,
    operator: String (enum: ['equals', 'in', 'notIn', 'exists']),
    value: Mixed,
    context: String (enum: ['user', 'department', 'branch'])
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// AccessException Schema
{
  grantedTo: ObjectId (ref: User),
  grantedBy: ObjectId (ref: User),
  resourceType: String,
  resourceId: ObjectId (optional),
  scope: String (enum: ['read', 'write', 'full']),
  expiresAt: Date (optional),
  reason: String (optional),
  isActive: Boolean,
  createdAt: Date
}
```

### A.2 ABAC Models

```typescript
// Policy Schema
{
  name: String (unique),
  description: String,
  effect: String (enum: ['allow', 'deny']),
  priority: Number,
  rules: [{
    subject: {
      roles: [String],
      departments: [ObjectId],
      branches: [ObjectId],
      attributes: Map
    },
    resource: {
      type: String,
      attributes: Map
    },
    action: [String],
    conditions: [PolicyCondition]
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### A.3 Hybrid Models

```typescript
// ResourceOwnership Schema
{
  resourceType: String (indexed),
  resourceId: ObjectId (indexed),
  owner: ObjectId (ref: User, indexed),
  sharedWith: [{
    user: ObjectId (ref: User),
    accessLevel: String (enum: ['read', 'write', 'full']),
    grantedBy: ObjectId (ref: User),
    grantedAt: Date,
    expiresAt: Date (optional),
    reason: String
  }],
  department: ObjectId (ref: Department, indexed),
  branch: ObjectId (ref: Branch, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Appendix B: Pseudo-Code Examples

### B.1 Doctor Viewing Own Appointments

```typescript
// User: Doctor (ID: doc123)
// Permission: appointments.view
// Resource: appointment

// Step 1: Check permission
hasPermission('appointments.view') → true

// Step 2: Get scope
scope = getScope('appointments.view') → 'own'

// Step 3: Build filter
filter = {
  doctor: 'doc123'  // User's ID
}

// Step 4: Query
appointments = Appointment.find(filter)
```

### B.2 Doctor Viewing Department Appointments (Exception)

```typescript
// User: Doctor (ID: doc123, Department: dept1)
// Permission: appointments.view
// Resource: appointment
// Context: departmentSharingEnabled = true

// Step 1: Check permission
hasPermission('appointments.view') → true

// Step 2: Get scope
scope = getScope('appointments.view') → 'own'

// Step 3: Check exception/override
exception = checkDepartmentSharing('doc123', 'dept1')
if (exception.allowed) {
  filter = {
    $or: [
      { doctor: 'doc123' },  // Own appointments
      { departmentId: 'dept1', doctor: { $ne: 'doc123' } }  // Department appointments
    ]
  }
}

// Step 4: Query
appointments = Appointment.find(filter)
```

### B.3 Shared Secretary Access

```typescript
// User: Secretary (ID: sec123, isSharedSecretary: true)
// Permission: patients.view
// Resource: patient

// Step 1: Check permission
hasPermission('patients.view') → true

// Step 2: Get scope
scope = getScope('patients.view') → 'branch'

// Step 3: Check ABAC policy
policy = evaluatePolicy({
  subject: { role: 'سكرتير', isSharedSecretary: true },
  resource: { type: 'patient' },
  action: 'view'
}) → { allowed: true, filter: { branch: 'branch123' } }

// Step 4: Query
patients = Patient.find({ branch: 'branch123' })
```

---

## Appendix C: Performance Benchmarks (Estimated)

| Operation | Current (Hardcoded) | Approach 1 | Approach 2 | Approach 3 |
|-----------|-------------------|------------|------------|-------------|
| Permission Check | 5ms | 8ms (cached: 1ms) | 12ms (cached: 2ms) | 15ms (cached: 3ms) |
| Filter Build | 2ms | 10ms (cached: 2ms) | 15ms (cached: 3ms) | 20ms (cached: 4ms) |
| Exception Check | N/A | 5ms | 8ms | 10ms |
| Ownership Check | N/A | N/A | N/A | 8ms |
| **Total (Cached)** | **7ms** | **13ms** | **25ms** | **45ms** |
| **Total (Uncached)** | **7ms** | **23ms** | **35ms** | **53ms** |

*Note: Cached performance is acceptable for production use.*

---

## Document Version

- **Version**: 1.0
- **Date**: 2025-01-11
- **Author**: AI Assistant
- **Status**: Draft for Review

---

**End of Report**

