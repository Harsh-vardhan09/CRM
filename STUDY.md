# Twenty — Open-Source CRM Platform

## Project Overview

```text
twentyhq-twenty/
├── packages/
│   ├── create-twenty-app/
│   └── twenty-apps/
│       ├── community/
│       ├── examples/
│       ├── fixtures/
│       └── internal/
├── README.md
├── DESIGN.md
├── PRODUCT.md
├── package.json
└── nx.json
```

## What is Twenty?

Twenty is described by its creators as **"The #1 Open-Source CRM"** — a platform that gives technical teams the building blocks for a custom CRM that meets complex business needs and adapts as the business evolves.

Unlike traditional no-code CRMs, Twenty is explicitly designed to be **built, shipped, and versioned like any other piece of software** in a team's stack.

---

# Core Value Proposition

* Full ownership of data and infrastructure through self-hosting options.
* CRM logic defined as code — objects, fields, views, and workflows live in version control.
* An extension system (**Apps**) that allows developers to add custom functionality without forking the core product.
* Modern, well-designed UI with AI agent integration built in from the ground up.
* Open-source under **AGPL-3.0**, with an optional commercial Enterprise license.

---

# Technology Stack

Twenty uses a **TypeScript-everywhere** approach. The same language runs on both the server and the client, simplifying context switching and enabling code sharing through shared packages.

## 3.1 Stack Overview

| Layer                 | Technology             | Purpose                                           |
| --------------------- | ---------------------- | ------------------------------------------------- |
| Language              | TypeScript 5.9         | Entire codebase — strict mode enforced            |
| Frontend Framework    | React 18               | UI components and application shell               |
| Backend Framework     | NestJS                 | Modular server, dependency injection, decorators  |
| API Layer             | GraphQL (GraphQL Yoga) | Code-first schema, primary data access API        |
| Primary Database      | PostgreSQL             | All CRM data, multi-tenant schema                 |
| Cache / Sessions      | Redis                  | Session storage, cache, pub/sub                   |
| Job Queue             | BullMQ                 | Background job processing (email, webhooks, sync) |
| State Management      | Jotai                  | Atomic state model for the React frontend         |
| Styling               | Linaria                | Zero-runtime CSS-in-JS                            |
| Internationalisation  | Lingui                 | i18n for all user-visible strings                 |
| Monorepo Tooling      | Nx + Yarn 4            | Task orchestration, caching, workspace management |
| Build Tool (Frontend) | Vite                   | Fast dev server and production builds             |
| Analytics (Optional)  | ClickHouse             | High-performance event analytics                  |

## 3.2 Why This Stack?

### NestJS

* Provides a highly structured backend.
* Supports modules, guards, interceptors, and decorators.
* Helps large codebases remain maintainable as they scale.

### GraphQL Code-First

* TypeScript types are the source of truth.
* Schema is generated automatically from decorators.
* Eliminates the need to maintain separate schema files.

### Linaria

* Produces zero-runtime CSS.
* Extracts styles during build time.
* Avoids runtime style injection overhead.

### Jotai

* Atomic state model.
* Less boilerplate than Redux.
* Predictable and easy to test.

### Nx

* Enables incremental builds and test execution.
* Only affected packages are rebuilt or tested.

---

# Repository & Monorepo Structure

The entire Twenty codebase lives in a single **Nx-managed monorepo**. All packages share:

* `node_modules`
* Base TypeScript configuration
* Linting rules
* CI/CD pipeline

Changes to shared packages automatically trigger rebuilds of dependent packages.

## 4.1 Top-Level Layout

| File / Directory     | Purpose                              |
| -------------------- | ------------------------------------ |
| `packages/`          | All application and library packages |
| `nx.json`            | Nx workspace configuration           |
| `package.json`       | Root workspace definition            |
| `tsconfig.base.json` | Base TypeScript configuration        |
| `.oxfmtrc.jsonc`     | Formatter configuration              |
| `jest.preset.js`     | Shared Jest configuration            |
| `CLAUDE.md`          | AI coding assistant instructions     |
| `DESIGN.md`          | Marketing site design system         |
| `PRODUCT.md`         | Product and brand context            |

---

## 4.2 Core Packages

| Package              | Type        | Description                          |
| -------------------- | ----------- | ------------------------------------ |
| `twenty-front`       | React App   | Main CRM web application             |
| `twenty-server`      | NestJS App  | Backend API, GraphQL server, workers |
| `twenty-ui`          | Library     | Shared UI component library          |
| `twenty-shared`      | Library     | Shared types, utilities, helpers     |
| `twenty-emails`      | Library     | React Email templates                |
| `twenty-sdk`         | Library     | SDK for building Twenty apps         |
| `twenty-client-sdk`  | Library     | Typed GraphQL client                 |
| `twenty-cli`         | CLI Tool    | Workspace and app management CLI     |
| `create-twenty-app`  | CLI Tool    | App scaffolding tool                 |
| `twenty-website`     | Next.js App | Marketing website                    |
| `twenty-docs`        | Docs Site   | Documentation platform               |
| `twenty-e2e-testing` | Test Suite  | Playwright end-to-end tests          |
| `twenty-apps`        | Examples    | Community-built applications         |

---

# Frontend Architecture (`twenty-front`)

The frontend is a **React 18 Single Page Application (SPA)** built with **Vite**.

### Key Technologies

* React 18
* Apollo Client
* GraphQL
* Jotai
* Linaria

---

## 5.1 State Management with Jotai

Jotai uses an **atomic state model**. Instead of one large global store, state is split into small independent atoms.

### Benefits

* Components subscribe only to the state they need.
* Reduced re-renders.
* Improved performance and maintainability.

| Pattern        | Usage                       |
| -------------- | --------------------------- |
| `atom()`       | Primitive state             |
| Derived Atom   | Computed state              |
| `atomFamily()` | Dynamic collections         |
| Apollo Cache   | Server-fetched GraphQL data |

---

## 5.2 Styling with Linaria

Linaria is a **zero-runtime CSS-in-JS** library.

### Characteristics

* Styled-components-like API.
* CSS extracted at build time.
* No runtime style computation.
* Performance equivalent to plain CSS.

---

## 5.3 Component Architecture

### Standards

* Functional components only.
* Class components are forbidden.
* Named exports only.
* No default exports.

### Organization

* Components should remain under 300 lines.
* Larger components are split into smaller units.
* Each component has:

  * Its own directory
  * Test file
  * Storybook story

### Imports

* `index.ts` barrel exports provide clean import paths.

---

# Backend Architecture (`twenty-server`)

The backend is built with **NestJS**, a structured and opinionated Node.js framework.

### Responsibilities

* GraphQL API
* Authentication
* Business logic
* Background workers

---

## 6.1 NestJS Module System

Each feature area is organized into a dedicated module.

Examples:

* Authentication
* Workspaces
* Objects
* Emails

### Example Module

```ts
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
```

### Benefits

* Clear boundaries
* Dependency management
* Reusable services
* Scalable architecture

---

## 6.2 GraphQL Layer

Twenty uses a **code-first GraphQL** architecture with **GraphQL Yoga**.

### How It Works

* `@ObjectType()` → GraphQL Types
* `@Query()` → GraphQL Queries
* `@Mutation()` → GraphQL Mutations
* Schema generated automatically

### Available Schemas

#### Core API

Handles:

* Users
* Workspaces
* CRM records

#### Metadata API

Handles:

* Object definitions
* Field definitions
* Workspace metadata

---

## 6.3 Database Layer (TypeORM + PostgreSQL)

Twenty uses **TypeORM** for data access and **PostgreSQL** for storage.

### Multi-Tenant Architecture

Each workspace receives its own PostgreSQL schema.

| Schema           | Contents                        |
| ---------------- | ------------------------------- |
| `core`           | Users, workspaces, billing      |
| `metadata`       | Object and field definitions    |
| `workspace_{id}` | Contacts, deals, custom objects |

### Benefits

* Strong tenant isolation
* Easier maintenance
* Improved security boundaries

---

## 6.4 Background Processing (BullMQ + Redis)

Long-running tasks are executed asynchronously through **BullMQ** queues backed by **Redis**.

### Examples

* Sending emails
* Processing webhooks
* Running sync jobs
* External integrations

### Architecture

```text
API Server
    │
    ▼
 BullMQ Queue
    │
    ▼
 Worker Process
```

### Benefits

* Faster API responses
* Improved scalability
* Better fault isolation

---

## 6.5 Key Backend Concepts

| Concept      | Implementation               | Purpose                             |
| ------------ | ---------------------------- | ----------------------------------- |
| Guards       | NestJS Guards                | Authentication and authorization    |
| Interceptors | NestJS Interceptors          | Logging and response transformation |
| Decorators   | `@RegisteredInstanceCommand` | Auto-discovery of commands          |
| Entities     | TypeORM `@Entity`            | Database table definitions          |
| DTOs         | `class-validator` classes    | Input validation                    |
| Services     | Injectable providers         | Business logic                      |
| Resolvers    | GraphQL `@Resolver`          | API endpoint handlers               |

---

# Summary

Twenty is an **open-source, developer-first CRM platform** built around:

* TypeScript everywhere
* React + NestJS architecture
* GraphQL code-first APIs
* PostgreSQL multi-tenancy
* BullMQ background processing
* Nx-powered monorepo development
* Version-controlled CRM customization

Its primary goal is to enable organizations to treat CRM development the same way they treat application development: **code-driven, extensible, self-hostable, and version-controlled**.
