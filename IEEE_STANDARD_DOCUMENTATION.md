 IEEE Software Requirements Specification (SRS) & System Design Document (SDD)
 For NutriPlan — Recipe Planning & Calorie Analysis System
Standard: IEEE Std 8301998 / ISO/IEC/IEEE 29148 & IEEE Std 10162009  
Document Identifier: IEEESRSSDDNUTRI2026V1.0  
Version: 1.0.0  
Date: August 23, 2026  
Status: Approved / Production Ready  



 Executive Metadata

 Attribute  Specification 

 System Name  NutriPlan — FullStack Recipe Planner & Calorie Analyzer 
 Document Classification  Software Requirements Specification & Architectural Design (IEEE 830 / 1016) 
 System Architecture  Decoupled ClientServer (Angular 20 SPA + Python Flask REST API + SQLite 3) 
 Primary Stakeholders  End Users, System Administrators, Nutritionists, Developers 
 Operating System Support  CrossPlatform (Windows 10/11, macOS 12+, Linux Ubuntu 20.04+) 



 Table of Contents
1. [Section 1: Introduction](1introduction)
    1.1 Purpose
    1.2 Document Conventions
    1.3 Intended Audience & Reading Suggestions
    1.4 Project Scope
    1.5 References & Standards
2. [Section 2: Overall Description](2overalldescription)
    2.1 Product Perspective
    2.2 Product Functions
    2.3 User Classes & Personas
    2.4 Operating Environment
    2.5 Design & Implementation Constraints
    2.6 Assumptions & Dependencies
3. [Section 3: System Architecture & Design (IEEE 1016)](3systemarchitecturedesignieee1016)
    3.1 HighLevel Architectural Decomposition
    3.2 Data Flow & Control Architecture
    3.3 Component Interfaces
4. [Section 4: Data Models & Database Specifications](4datamodelsdatabasespecifications)
    4.1 EntityRelationship Model (ERD)
    4.2 Data Dictionary & Schema Definitions
    4.3 CopyOnWrite Global vs. Custom Entity Lifecycle
5. [Section 5: System Features & Functional Requirements](5systemfeaturesfunctionalrequirements)
    5.1 RoleBased Access Control & Admin Approval Workflow
    5.2 Food Catalog & Search Subsystem
    5.3 Recipe Engine & Natural Language Ingredient Parser
    5.4 Live Dynamic Portion Scaler
    5.5 Weekly Calendar Meal Planning Subsystem
    5.6 RealTime Calorie & Macronutrient Math Engine
    5.7 Smart Aggregated Grocery Logistics Engine
    5.8 Administrative Governance Portal
6. [Section 6: External Interface Requirements](6externalinterfacerequirements)
    6.1 User Interfaces (UI/UX)
    6.2 Software Interfaces & REST API Specification
    6.3 Communications Interfaces & Token Protocols
7. [Section 7: NonFunctional Requirements & System Attributes](7nonfunctionalrequirementssystemattributes)
    7.1 Performance Requirements
    7.2 Security Requirements
    7.3 Reliability & Fault Tolerance
    7.4 Usability & Accessibility
    7.5 Portability & Maintainability
8. [Section 8: Verification, Validation & Traceability Matrix](8verificationvalidationtraceabilitymatrix)
    8.1 Requirements Traceability Matrix (RTM)
    8.2 Test Suite Execution Results
9. [Section 9: Deployment, Operations & Maintenance](9deploymentoperationsmaintenance)
    9.1 Hardware & Software Prerequisites
    9.2 Build & Execution Procedures
    9.3 Failure Recovery & Disaster Recovery Procedures
10. [Section 10: Appendix & Glossary](10appendixglossary)



 1. Introduction

 1.1 Purpose
This document constitutes the formal Software Requirements Specification (SRS) and Software Design Description (SDD) for the NutriPlan enterprise web application, conforming to IEEE Std 8301998 and IEEE Std 10162009. It specifies the functional and nonfunctional requirements, architectural blueprints, mathematical nutrition computation rules, database schemas, security protocols, and verification criteria governing the system.

 1.2 Document Conventions
 Requirement Identifiers: Functional requirements are tagged as `FR<MODULE><ID>`, and NonFunctional requirements as `NFR<CATEGORY><ID>`.
 Typographical Emphasis: Bold text indicates key system symbols, database entities, or UI states. Code identifiers and HTTP routes are formatted in monospace (`/api/recipes`).
 Priority Ratings:
   `[High]`: Critical path requirement essential for core operations.
   `[Medium]`: Significant capability providing primary user value.
   `[Low]`: Supplementary enhancement or administrative convenience.

 1.3 Intended Audience & Reading Suggestions
 Software Engineers & Architects: Focus on [Section 3](3systemarchitecturedesignieee1016), [Section 4](4datamodelsdatabasespecifications), and [Section 6](6externalinterfacerequirements).
 Quality Assurance & Verification Teams: Focus on [Section 5](5systemfeaturesfunctionalrequirements) and [Section 8](8verificationvalidationtraceabilitymatrix).
 System Administrators & Security Auditors: Focus on [Section 2.3](2userclassespersonas), [Section 5.1](51rolebasedaccesscontroladminapprovalworkflow), and [Section 7.2](72securityrequirements).

 1.4 Project Scope
NutriPlan delivers a unified webbased environment designed to eliminate the friction of nutritional tracking and meal planning. The system:
1. Manages a standardized reference database of 213 global food ingredients and 100 starter recipes (with a specialized emphasis on South Indian and regional cuisines).
2. Allows every authenticated user to browse global libraries and create personalized custom recipes and foods.
3. Automatically parses unstructured ingredient lines (e.g., `"1 1/2 cups basmati rice"`) into structured database relationships.
4. Computes exact portionscaled caloric, macronutrient (Protein, Carbohydrates, Fat), and micronutrient (Fiber, Sugar, Sodium) outputs.
5. Aggregates weekly scheduled meal ingredients into categorized, checkable grocery shopping lists.
6. Implements an administrative gatekeeping workflow to ensure controlled user onboarding and system security.

 1.5 References & Standards
1. IEEE Std 8301998: IEEE Recommended Practice for Software Requirements Specifications.
2. IEEE Std 10162009: IEEE Standard for Information Technology — Systems Design — Software Design Descriptions.
3. RFC 7519: JSON Web Token (JWT) Architecture and Security.
4. USDA FoodData Central Reference Database Standard: Foundation for nutritional density conversions per 100g.
5. MifflinSt Jeor Equation: Standardized metabolic formulation for Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).



 2. Overall Description

 2.1 Product Perspective
NutriPlan operates as a selfcontained, highperformance web system. It provides both standalone execution (via an integrated Python WSGI web server serving compiled client bundles) and distributed development deployment (hotreloading Angular development server with CORS support).

```mermaid
graph LR
    subgraph Client Layer
        Browser["User Web Browser (Desktop / Mobile)"]
    end
    subgraph Presentation & Application Layer
        AngularSPA["Angular 20 SPA Engine\n(Signals, Reactive Routing, Guards)"]
        FlaskAPI["Python Flask 3.x REST Core\n(JWT Guard, Route Dispatcher)"]
    end
    subgraph Computational Engines
        Parser["NLP Regex Parser Engine"]
        MacroEngine["Nutrition Calculus Matrix"]
    end
    subgraph Persistence Layer
        DB[(SQLite3 Database Engine\nSQLAlchemy ORM)]
        StaticStore["Static Photo Assets\n(/static/food_images, /static/recipe_images)"]
    end

    Browser <>HTTPS / REST API AngularSPA
    AngularSPA <>JSON Payload with Bearer Token FlaskAPI
    FlaskAPI > Parser
    FlaskAPI > MacroEngine
    FlaskAPI <>SQL Transactional Queries DB
    FlaskAPI >File Streaming StaticStore
```

 2.2 Product Functions
 User Identity & Access Governance: Account request, verification, password hashing, admin approvals, session management via JWT.
 Nutrient Calculation Engine: Live summation and perserving scaling of caloric and macronutrient metrics.
 Heuristic Ingredient Parsing: NLP tokenization of complex quantity expressions, fractions, unit aliases, and ingredient labels.
 Weekly Meal Matrix Management: 7day × 4meal slot interactive scheduler with portion steppers.
 Smart Grocery Consolidation: Automated ingredient summation across recipes with aisle classification.

 2.3 User Classes & Personas
 User Class  Privilege Level  Key Characteristics & Permissions 

 Pending Registrant  Level 0 (None)  A user who submitted the registration form. Cannot access API or view any internal data until approved by an administrator. 
 Standard User  Level 1 (Active)  An authenticated individual. Can view all global foods/recipes, manage personal meal plans, create custom foods/recipes, track daily analytics, and export grocery lists. 
 System Administrator  Level 2 (Admin)  Master operator. Holds all standard user permissions plus user lifecycle controls (approval, suspension, password reset, role assignment), global recipe mutations, and platform analytics. 

 2.4 Operating Environment
 Server Operating Systems: Microsoft Windows 10/11, Windows Server 2019+, Ubuntu 20.04 LTS+, Debian 11+, macOS Monterey+.
 Server Runtimes: Python 3.10, 3.11, or 3.12 with SQLite 3.35+.
 Client Web Browsers: Google Chrome 110+, Mozilla Firefox 110+, Apple Safari 16+, Microsoft Edge 110+.
 Network Protocol: HTTP/1.1 or HTTP/2 over TLS/HTTPS; TCP Port 8000 (default) or Port 443.

 2.5 Design & Implementation Constraints
1. Zero External Cloud Dependencies: The system must run entirely onpremises without mandatory external cloud services for computation or database hosting.
2. Relational Consistency: Strict foreign key constraints and referential integrity enforced via SQLite / SQLAlchemy.
3. Stateless Backend: All authorization is handled via selfcontained HMACSHA256 JWT tokens, enabling linear backend scalability.

 2.6 Assumptions & Dependencies
 Python environment has standard Cextensions available for SQLite3.
 The browser environment supports modern ECMAScript 2022+ and CSS Grid / Flexbox standards.



 3. System Architecture & Design (IEEE 1016)

 3.1 HighLevel Architectural Decomposition
NutriPlan is architecturally partitioned into five distinct modular subsystems:

```mermaid
graph TB
    subgraph Subsystem 1: Identity & Authorization
        AuthMod["Auth Service & Interceptor"]
        RBAC["Role & Status Validator"]
        JWTGen["PyJWT Key Manager"]
    end

    subgraph Subsystem 2: Catalog & Ingredient Engine
        FoodCat["Food Data Service"]
        NLPParser["Parser Subsystem"]
        RecipeMgr["Recipe Composition Engine"]
    end

    subgraph Subsystem 3: Nutritional Computation
        PortionScaler["Portion Scaling Calculator"]
        MacroEngine2["Macro/Micro Aggregator"]
        TDEECalc["MifflinSt Jeor TDEE Engine"]
    end

    subgraph Subsystem 4: Meal Logistics & Planning
        WeeklyCal["Weekly Calendar Manager"]
        GroceryGen["Aisle Classifier & Aggregator"]
    end

    subgraph Subsystem 5: Persistence & Administration
        ORM["SQLAlchemy ORM Layer"]
        AdminPortal["Admin Management Console"]
    end

    AuthMod > RBAC > JWTGen
    FoodCat > NLPParser > RecipeMgr
    RecipeMgr > PortionScaler > MacroEngine2
    WeeklyCal > MacroEngine2
    WeeklyCal > GroceryGen
    AdminPortal > ORM
    MacroEngine2 > ORM
```

 3.2 Data Flow & Control Architecture

 User Authentication and Authorization Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser Client
    participant API as Flask API Layer
    participant JWT as JWT Engine
    participant DB as SQLite DB

    Client>>API: POST /api/auth/login {email, password}
    API>>DB: Query User by email
    DB>>API: Return User entity
    API>>API: Verify werkzeug password_hash
    alt User is pending
        API>>Client: 403 Forbidden {code: "pending", error: "Awaiting admin approval"}
    else User is disabled
        API>>Client: 403 Forbidden {code: "disabled", error: "Account disabled"}
    else User is active
        API>>JWT: Generate token(sub=user.id, role=user.role, exp=7d)
        JWT>>API: Signed JWT string
        API>>Client: 200 OK {token, user_dict} + SetCookie (np_token)
    end
```

 3.3 Component Interfaces
 API Interceptor (Angular): Injects `Authorization: Bearer <token>` into outgoing HTTP headers and redirects to `/login` upon receiving `401 Unauthorized`.
 Auth Guard (Angular): Guards private client routes (`/today`, `/recipes`, `/calendar`, `/grocery`, `/goals`, `/admin`), verifying token presence and role authorization.
 Nutrition Calculus Module (Python): Pure functional interface that receives recipe ingredient vectors and computes nutrient summaries without side effects.



 4. Data Models & Database Specifications

 4.1 EntityRelationship Model (ERD)

```mermaid
erDiagram
    users o{ goals : "defines targets (1:1)"
    users o{ foods : "owns custom foods (1:N)"
    users o{ recipes : "owns custom recipes (1:N)"
    users o{ plan_entries : "schedules meals (1:N)"
    users o{ grocery_checks : "stores check state (1:N)"
    users o{ grocery_extras : "creates extras (1:N)"
    recipes o{ ingredients : "contains (1:N, cascade delete)"
    foods o{ ingredients : "referenced by (1:N)"
    recipes o{ plan_entries : "selected in (1:N)"

    users {
        INTEGER id PK
        VARCHAR_255 email UK "Indexed, CaseInsensitive"
        VARCHAR_120 name
        VARCHAR_255 password_hash "PBKDF2 SHA256"
        VARCHAR_20 role "admin  user"
        VARCHAR_20 status "pending  active  disabled"
        DATETIME created_at "UTC Timestamp"
    }

    goals {
        INTEGER user_id PK, FK "References users.id"
        FLOAT kcal "Default 2000.0"
        FLOAT p "Protein (g) Default 100.0"
        FLOAT c "Carbohydrates (g) Default 250.0"
        FLOAT f "Fat (g) Default 67.0"
        VARCHAR_4 energy_unit "kcal  kJ"
    }

    foods {
        INTEGER id PK
        VARCHAR_40 key UK "Indexed unique key (e.g. food_rice_basmati)"
        VARCHAR_160 name "Display name"
        VARCHAR_255 aliases "Commaseparated search keywords"
        VARCHAR_4 cat "Category code (FR, VG, GR, FL, DY, MF, etc.)"
        FLOAT k "Calories per 100g"
        FLOAT p "Protein (g) per 100g"
        FLOAT c "Carbohydrates (g) per 100g"
        FLOAT f "Fat (g) per 100g"
        FLOAT fib "Fiber (g) per 100g"
        FLOAT sug "Sugar (g) per 100g"
        FLOAT na "Sodium (mg) per 100g"
        JSON units "Custom unit weights {cup: 158, piece: 120}"
        BOOLEAN liq "Is liquid item"
        BOOLEAN skip "Exclude from grocery lists"
        VARCHAR_255 image "Static photo filename"
        INTEGER owner_user_id FK "NULL = Global Food, Integer = User Custom Food"
    }

    recipes {
        INTEGER id PK
        INTEGER user_id FK "NULL = Global Library Recipe, Integer = User Custom Recipe"
        VARCHAR_200 name "Recipe Title"
        FLOAT servings "Base portion count (Default 4.0)"
        TEXT steps "Preparation steps"
        VARCHAR_255 image "Static photo filename"
    }

    ingredients {
        INTEGER id PK
        INTEGER recipe_id FK "References recipes.id, Cascade Delete"
        INTEGER food_id FK "References foods.id, Nullable"
        FLOAT qty "Measurement quantity"
        VARCHAR_20 unit "Unit symbol (g, kg, cup, tbsp, piece, etc.)"
        VARCHAR_255 raw "Original unparsed text line"
        INTEGER position "Sort index in recipe"
    }

    plan_entries {
        INTEGER id PK
        INTEGER user_id FK "References users.id, Cascade Delete"
        INTEGER day "0=Monday .. 6=Sunday"
        VARCHAR_20 slot "breakfast  lunch  dinner  snacks"
        INTEGER recipe_id FK "References recipes.id"
        FLOAT servings "Scheduled portion count"
    }

    grocery_checks {
        INTEGER id PK
        INTEGER user_id FK "References users.id"
        VARCHAR_64 item_key "Identifier of food item or extra"
        BOOLEAN checked "Checked state"
    }

    grocery_extras {
        INTEGER id PK
        INTEGER user_id FK "References users.id"
        VARCHAR_200 name "Item description"
    }
```

 4.2 Data Dictionary & Schema Definitions

 Table: `users`
 Column  Type  Nullable  Constraints  Description 

 `id`  `INTEGER`  No  Primary Key, Autoincrement  Unique identifier for the user account. 
 `email`  `VARCHAR(255)`  No  Unique, Index  Caseinsensitive email address used for login. 
 `name`  `VARCHAR(120)`  No  —  Full name of the user. 
 `password_hash`  `VARCHAR(255)`  No  —  Salted hash generated using PBKDF2 with SHA256. 
 `role`  `VARCHAR(20)`  No  Default `'user'`  Role permission: `'admin'` or `'user'`. 
 `status`  `VARCHAR(20)`  No  Default `'pending'`  Lifecycle state: `'pending'`, `'active'`, `'disabled'`. 
 `created_at`  `DATETIME`  No  Default `UTC NOW`  Timestamp of account creation. 

 Table: `recipes`
 Column  Type  Nullable  Constraints  Description 

 `id`  `INTEGER`  No  Primary Key, Autoincrement  Unique identifier for the recipe. 
 `user_id`  `INTEGER`  Yes  Foreign Key (`users.id`), Index  Ownership Flag: `NULL` = Global Library Recipe; `Integer` = Custom Recipe. 
 `name`  `VARCHAR(200)`  No  —  Display title of the recipe. 
 `servings`  `FLOAT`  No  Default `4.0`  Base portion count for the ingredient amounts. 
 `steps`  `TEXT`  No  Default `''`  Preparation and cooking instructions. 
 `image`  `VARCHAR(255)`  Yes  —  Image filename located in `/static/recipe_images/`. 

 Table: `foods`
 Column  Type  Nullable  Constraints  Description 

 `id`  `INTEGER`  No  Primary Key, Autoincrement  Unique food identifier. 
 `key`  `VARCHAR(40)`  No  Unique  Stable key (e.g., `food_moong_dal` or `cf_a1b2c3d4`). 
 `name`  `VARCHAR(160)`  No  —  Food display name. 
 `aliases`  `VARCHAR(255)`  No  Default `''`  Search keyword list for heuristic matching. 
 `cat`  `VARCHAR(4)`  No  Default `'MY'`  Aisle/Category code (`GR`, `VG`, `DY`, `PF`, etc.). 
 `k`  `FLOAT`  No  Default `0.0`  Energy content in kilocalories (kcal) per 100g. 
 `p`  `FLOAT`  No  Default `0.0`  Protein in grams per 100g. 
 `c`  `FLOAT`  No  Default `0.0`  Total Carbohydrates in grams per 100g. 
 `f`  `FLOAT`  No  Default `0.0`  Total Lipids/Fat in grams per 100g. 
 `fib`  `FLOAT`  No  Default `0.0`  Dietary Fiber in grams per 100g. 
 `sug`  `FLOAT`  No  Default `0.0`  Total Sugars in grams per 100g. 
 `na`  `FLOAT`  No  Default `0.0`  Sodium in milligrams per 100g. 
 `units`  `JSON`  Yes  —  Custom unit weights dictionary (e.g., `{"cup": 160}`). 
 `liq`  `BOOLEAN`  No  Default `0`  Boolean indicator for liquid densities (ml to g). 
 `skip`  `BOOLEAN`  No  Default `0`  Flag to omit item from grocery list (e.g., water). 
 `image`  `VARCHAR(255)`  Yes  —  Image filename located in `/static/food_images/`. 
 `owner_user_id` `INTEGER`  Yes  Foreign Key (`users.id`)  Ownership Flag: `NULL` = Global Food; `Integer` = Custom Food. 

 4.3 CopyOnWrite Global vs. Custom Entity Lifecycle

```mermaid
stateDiagramv2
    [] > GlobalRecipe: System Seeded (user_id = NULL)
    
    state GlobalRecipe {
        [] > ViewableByAll
        ViewableByAll > SchedulableInCalendar
    }

    GlobalRecipe > CustomForkedRecipe: Standard User Edits Global Recipe
    GlobalRecipe > GlobalRecipe: Admin Edits Global Recipe (InPlace Update)
    
    state CustomForkedRecipe {
        [] > UserOwned: Assigned user_id = CurrentUser.id
        UserOwned > UserEditable
        UserOwned > UserDeletable
    }

    CustomForkedRecipe > []: User Deletes Recipe
```



 5. System Features & Functional Requirements

 5.1 RoleBased Access Control & Admin Approval Workflow
 FRAUTH01 [High]: System shall allow visitors to submit registration requests providing Name, Email, and Password (minimum 6 characters).
 FRAUTH02 [High]: Newly registered accounts shall be initialized with `status = 'pending'` and `role = 'user'`.
 FRAUTH03 [High]: System shall deny login attempts for accounts in `'pending'` or `'disabled'` states with explicit HTTP 403 status and machinereadable error codes.
 FRAUTH04 [High]: System shall authenticate valid active credentials and issue an HMACSHA256 signed JWT containing `sub` (User ID), `role`, `iat`, and `exp` (7day validity).
 FRAUTH05 [High]: Administrators shall have dedicated API endpoints to approve (`status = 'active'`), disable (`status = 'disabled'`), promote (`role = 'admin'`), or reset passwords for any user.

 5.2 Food Catalog & Search Subsystem
 FRFOOD01 [High]: System shall maintain a standard reference database of 213 food items with nutritional densities per 100 grams.
 FRFOOD02 [High]: The endpoint `GET /api/foods/all` shall return all global foods (`owner_user_id IS NULL`) combined with any custom foods created by the requesting user (`owner_user_id = user.id`).
 FRFOOD03 [Medium]: The food search engine shall support substring and alias matching with ranked scoring over food names and alias keywords.
 FRFOOD04 [Medium]: Users shall be able to create custom foods (`POST /api/foods`) with personalized macro specifications and piece/cup unit weights.

 5.3 Recipe Engine & Natural Language Ingredient Parser
 FRRCP01 [High]: System shall expose 100 starter recipes with preconfigured ingredient compositions, stepbystep instructions, and photography.
 FRRCP02 [High]: The endpoint `GET /api/recipes` shall return all global library recipes and user custom recipes to all active users.
 FRRCP03 [High]: Natural Language Parser (`POST /api/parse`) shall tokenize raw ingredient strings into structured records:
  $$\text{Input: } \texttt{"1 1/2 cups basmati rice"} \implies \begin{cases} \text{Quantity:} & 1.5 \\ \text{Unit:} & \texttt{"cup"} \\ \text{Matched Food:} & \texttt{"Basmati Rice"} \\ \text{Grams:} & 237.0\text{ g} \end{cases}$$
 FRRCP04 [High]: The parser shall correctly resolve vulgar fractions ($\frac{1}{2}, \frac{1}{4}, \frac{3}{4}, \frac{1}{3}, \frac{2}{3}, \frac{1}{8}$), compound expressions (`1 1/2`), and unit synonyms (`tbsp`, `tbs`, `tablespoon`, `pc`, `piece`, `clove`, `katori`, `pack`).

 5.4 Live Dynamic Portion Scaler
 FRSCALE01 [Medium]: The Recipe Editor shall provide live portion scaling preview capabilities.
 FRSCALE02 [Medium]: For a recipe with base portion count $S_{\text{base}}$ and scaled view portion count $S_{\text{view}}$, the scaled quantity $Q_{\text{scaled}}$ for an ingredient with base quantity $Q_{\text{base}}$ shall be calculated as:
  $$Q_{\text{scaled}} = Q_{\text{base}} \times \left( \frac{S_{\text{view}}}{S_{\text{base}}} \right)$$

 5.5 Weekly Calendar Meal Planning Subsystem
 FRPLAN01 [High]: The system shall provide a 7day matrix (Day 0 = Monday through Day 6 = Sunday) partitioned into four daily slots: `breakfast`, `lunch`, `dinner`, and `snacks`.
 FRPLAN02 [High]: Users shall be able to schedule any available recipe (global or custom) into any slot with customizable serving counts.
 FRPLAN03 [High]: The meal planner shall support serving increments and decrements ($\pm 0.5$ servings) with instantaneous reactive total recalculation.

 5.6 RealTime Calorie & Macronutrient Math Engine
 FRNUT01 [High]: Total nutrient metrics for a recipe shall be computed as the exact sum of its constituent ingredient gram weights multiplied by their respective densities:
  $$N_{\text{recipe}} = \sum_{i=1}^{k} \left( \frac{\text{Grams}(Q_i, U_i, \text{Food}_i)}{100} \times N_{\text{Food}_i/100\text{g}} \right)$$
 FRNUT02 [High]: Perserving nutrient metrics shall be computed by dividing total recipe metrics by the base serving count $S$:
  $$N_{\text{serving}} = \frac{N_{\text{recipe}}}{S}$$
 FRNUT03 [Medium]: The system shall compute caloric macro split ratios ($P_{\%}, C_{\%}, F_{\%}$) using Atwater general factor values (Protein: $4\text{ kcal/g}$, Carbohydrate: $4\text{ kcal/g}$, Fat: $9\text{ kcal/g}$):
  $$E_{\text{total}} = (P \times 4) + (C \times 4) + (F \times 9)$$
  $$P_{\%} = \frac{P \times 4}{E_{\text{total}}} \times 100, \quad C_{\%} = \frac{C \times 4}{E_{\text{total}}} \times 100, \quad F_{\%} = \frac{F \times 9}{E_{\text{total}}} \times 100$$
 FRNUT04 [Low]: The system shall support dynamic unit conversion between Kilocalories and Kilojoules ($1\text{ kcal} = 4.184\text{ kJ}$).

 5.7 Smart Aggregated Grocery Logistics Engine
 FRGROC01 [High]: The system shall analyze all scheduled meals in a user's weekly calendar and aggregate total required ingredient weights across all recipes.
 FRGROC02 [High]: Items marked with `skip = true` (such as tap water) shall be excluded from generated grocery lists.
 FRGROC03 [Medium]: Aggregated grocery items shall be partitioned into standard supermarket aisle categories (`Produce`, `Grains & Flours`, `Dairy & Eggs`, `Meat & Fish`, `Spices & Oils`, `Pantry Staples`).
 FRGROC04 [Medium]: Checked states of grocery items shall persist in the database per user account across sessions.

 5.8 Administrative Governance Portal
 FRADM01 [High]: Admin console shall display live system metrics: Total Users, Pending Approvals, Active Users, Disabled Users, Global Recipes, Custom Recipes, and Food Items.
 FRADM02 [High]: Admin console shall provide oneclick approval workflows for pending user registrations.
 FRADM03 [Medium]: Admin console shall allow direct creation of preactivated accounts with configurable roles (`admin` or `user`).



 6. External Interface Requirements

 6.1 User Interfaces (UI/UX)
 Design Aesthetic: Modern glassmorphism with highcontrast emerald green primary accents (`14a05a`, `107c44`), neutral slate typography (`1d2a1f`), subtle card lifting animations, and responsive flex/grid layouts.
 Responsive Layout: Fluid breakpoints supporting mobile screens (320px–767px), tablets (768px–1023px), and desktop viewports (1024px–2560px).
 Interactive Modals: Floating dialog windows equipped with custom drag directives for draggable header interaction.

 6.2 Software Interfaces & REST API Specification

 Endpoint Route  Method  Header / Auth  Request Body  Response Codes  Description 

 `/api/auth/register`  `POST`  None  `{"name", "email", "password"}`  `201`, `400`  Submits new account request. 
 `/api/auth/login`  `POST`  None  `{"email", "password"}`  `200`, `401`, `403`  Verifies credentials and issues JWT token. 
 `/api/auth/me`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Returns current user session object. 
 `/api/foods/all`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Returns complete catalog of global and custom foods. 
 `/api/foods`  `POST`  `Bearer <JWT>`  `{"name", "k", "p", "c", "f", ...}`  `201`, `400`, `401`  Creates a user custom food. 
 `/api/recipes`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Returns list of global and userowned recipes. 
 `/api/recipes`  `POST`  `Bearer <JWT>`  `{"name", "servings", "steps", "ingredients": [...]}`  `201`, `400`, `401`  Creates a new custom recipe. 
 `/api/recipes/<id>`  `GET`  `Bearer <JWT>`  None  `200`, `404`, `401`  Returns full recipe detail including nutrition metrics. 
 `/api/recipes/<id>`  `PUT`  `Bearer <JWT>`  `{"name", "servings", "steps", "ingredients": [...]}`  `200`, `201`, `400`, `401`  Updates custom recipe or forks global recipe. 
 `/api/recipes/<id>`  `DELETE`  `Bearer <JWT>`  None  `200`, `403`, `404`, `401`  Deletes custom recipe (or global recipe if admin). 
 `/api/parse`  `POST`  `Bearer <JWT>`  `{"text": "raw ingredient lines"}`  `200`, `400`, `401`  Parses and matches ingredient text lines. 
 `/api/plan`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Returns user's weekly scheduled meals. 
 `/api/plan/entries`  `POST`  `Bearer <JWT>`  `{"day", "slot", "recipe_id", "servings"}`  `201`, `400`, `401`  Schedules recipe into day slot. 
 `/api/plan/entries/<id>` `PATCH`  `Bearer <JWT>`  `{"servings": 2.5}`  `200`, `400`, `401`  Adjusts scheduled serving count. 
 `/api/plan/entries/<id>` `DELETE` `Bearer <JWT>`  None  `200`, `404`, `401`  Removes scheduled meal entry. 
 `/api/plan/day/<d>`  `GET`  `Bearer <JWT>`  None  `200`, `400`, `401`  Analyzes daily nutrition against user goals. 
 `/api/plan/week`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Returns 7day nutritional summary. 
 `/api/goals`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Returns daily target calories and macros. 
 `/api/goals`  `PUT`  `Bearer <JWT>`  `{"kcal", "p", "c", "f", "energy_unit"}`  `200`, `401`  Updates daily goals. 
 `/api/grocery`  `GET`  `Bearer <JWT>`  None  `200`, `401`  Generates aggregated weekly shopping list. 
 `/api/grocery/check`  `POST`  `Bearer <JWT>`  `{"key", "checked"}`  `200`, `400`, `401`  Updates item check state. 
 `/api/admin/stats`  `GET`  `Bearer <Admin JWT>`  None  `200`, `403`  Returns system overview statistics. 
 `/api/admin/users`  `GET`  `Bearer <Admin JWT>`  None  `200`, `403`  Lists all users with approval states. 
 `/api/admin/users/<id>/status`  `POST`  `Bearer <Admin JWT>`  `{"status": "active"}`  `200`, `400`, `403`  Modifies user lifecycle status. 

 6.3 Communications Interfaces & Token Protocols
 Token Format: Standard JSON Web Token (RFC 7519) signed via HS256 algorithm with a 256bit entropy secret key.
 Header Structure: `Authorization: Bearer <JWT_TOKEN_STRING>`
 Fallback Token Channels: Supports `XAuthToken` header, URL query parameter `?np_auth=`, and HTTP cookie `np_token` for proxy environments.



 7. NonFunctional Requirements & System Attributes

 7.1 Performance Requirements
 NFRPERF01 [High]: API response times for standard catalog and recipe queries (`/api/recipes`, `/api/foods/all`) shall not exceed 100 milliseconds under standard local load.
 NFRPERF02 [High]: Client bundle size for initial load shall remain under 500 KB transfer size to guarantee subsecond browser rendering.
 NFRPERF03 [Medium]: The NLP ingredient parser shall process 50 ingredient lines in less than 50 milliseconds.

 7.2 Security Requirements
 NFRSEC01 [High]: Passwords must never be stored in plaintext; hashing must utilize `PBKDF2HMACSHA256` with minimum 260,000 iteration cycles.
 NFRSEC02 [High]: SQL Injection prevention must be enforced using SQLAlchemy parameterized queries across all database operations.
 NFRSEC03 [High]: CrossSite Scripting (XSS) prevention shall be enforced by Angular's strict contextaware DOM sanitization.
 NFRSEC04 [High]: CrossOrigin Resource Sharing (CORS) shall explicitly enforce credentials authorization and origin whitelisting.

 7.3 Reliability & Fault Tolerance
 NFRREL01 [High]: Database transactions must satisfy ACID properties; failed recipe payload insertions must automatically trigger `db.session.rollback()`.
 NFRREL02 [Medium]: Uncaught server exceptions must be intercepted by global error handlers returning clean JSON formatted error objects (`{"error": "Internal server error"}`) with HTTP 500 status.

 7.4 Usability & Accessibility
 NFRUSE01 [Medium]: The user interface shall provide instant visual feedback (loading skeletons, microspinners, and nonblocking toast notifications) for all asynchronous operations.
 NFRUSE02 [Medium]: Interactive controls must feature explicit `arialabel` and `role` attributes conforming to WCAG 2.1 Level AA guidelines.

 7.5 Portability & Maintainability
 NFRPORT01 [High]: Codebase shall run crossplatform on Windows, macOS, and Linux without native OSspecific binaries.
 NFRPORT02 [Medium]: Frontend architecture shall leverage standalone Angular components and Signals for modular, testable unit separation.



 8. Verification, Validation & Traceability Matrix

 8.1 Requirements Traceability Matrix (RTM)

 Req ID  Requirement Description  Implementation Artifact  Verification Method  Status 

 FRAUTH01  User Registration Request  `app.py::auth_register()`  Automated Test Suite  VERIFIED 
 FRAUTH03  Gatekeeping / Approval Restriction  `app.py::auth_login()`  Automated Test Suite  VERIFIED 
 FRAUTH05  Admin Approval Workflow  `app.py::admin_set_status()`  Automated Test Suite  VERIFIED 
 FRFOOD02  Universal Food Catalog Visibility  `app.py::foods_catalog()`  Automated Integration Test  VERIFIED 
 FRRCP01  100 Starter Recipe Seed Data  `seed_recipes.py`, `seed.py`  DB Integrity Check  VERIFIED 
 FRRCP02  Universal Recipe Visibility  `app.py::available_recipes()`  Automated Test (`test_visibility`)  VERIFIED 
 FRRCP03  NLP Ingredient Line Parser  `parser.py::parse_ing_line()`  Unit Test Matrix  VERIFIED 
 FRSCALE01  Dynamic Portion Scaler  `recipes.component.ts::scale()`  Component Functional Test  VERIFIED 
 FRPLAN01  7Day Meal Scheduling Matrix  `calendar.component.ts`  EndtoEnd Test  VERIFIED 
 FRNUT01  Exact Macro/Micro Calculus  `nutrition.py::add_nut()`  Mathematical Validation  VERIFIED 
 FRGROC01  Weekly Grocery Aggregation  `app.py::grocery_get()`  Integration Test Suite  VERIFIED 
 NFRSEC01  PBKDF2 Password Security  `werkzeug.security`  Cryptographic Check  VERIFIED 

 8.2 Test Suite Execution Results

```text
============================= TEST SUITE EXECUTION =============================
Target Environment: SQLite 3.x / Flask 3.x / Python 3.11.x
Executed at: 20260823 09:10:40 UTC

[TEST 1] Database Sanity & Model Verification:
   Users in Database: 3 (1 Admin, 1 Demo, 1 Newly Registered User)
   Global Library Recipes: 100 recipes (user_id IS NULL) ................. PASS
   Global Food Ingredients: 213 foods (owner_user_id IS NULL) ............ PASS

[TEST 2] Identity & Universal Visibility Validation:
   Admin (admin@nutriplan.app) > GET /api/recipes: 100 returned ......... PASS
   Demo User (demo@nutriplan.app) > GET /api/recipes: 100 returned ...... PASS
   New User (sannidhinavadeep@gmail.com) > GET /api/recipes: 100 ret .... PASS
   New User > GET /api/foods/all: 213 items returned .................... PASS

[TEST 3] Meal Scheduling & Logistics:
   New User > POST /api/plan/entries (Tuesday Lunch): 201 Created ....... PASS
   New User > GET /api/grocery: 3 Aisle Categories Aggregated ........... PASS

[TEST 4] Custom Recipe Lifecycle & CopyOnWrite:
   New User > POST /api/recipes (Custom Shake): 201 Created (ID 101) .... PASS
   New User > GET /api/recipes (Post Creation): 101 recipes visible ..... PASS
   New User > DELETE /api/recipes/1 (Global Recipe): 403 Forbidden ...... PASS
   New User > DELETE /api/recipes/101 (Owned Custom Recipe): 200 OK ..... PASS

======================== 12 OF 12 VERIFICATIONS PASSED ========================
```



 9. Deployment, Operations & Maintenance

 9.1 Hardware & Software Prerequisites
 Minimum Hardware: 1 vCPU, 512 MB RAM, 200 MB Storage.
 Recommended Hardware: 2 vCPU, 2 GB RAM, 10 GB Storage.
 Software Dependencies: Python 3.10+ (Standard Library, Flask, FlaskCORS, FlaskSQLAlchemy, PyJWT, Werkzeug).

 9.2 Build & Execution Procedures

 Production Execution (Single Command)
```powershell
python start.py
```
The launcher automatically initializes dependencies, triggers database schema migrations, and exposes the service on `http://0.0.0.0:8000`.

 Production WSGI Server (Gunicorn)
```bash
gunicorn workers 4 bind 0.0.0.0:8000 "app:app"
```

 Client Compilation (Angular)
```powershell
cd frontend
npm.cmd install
npm.cmd run build
CopyItem Path "dist\frontend\browser\" Destination "..\backend\static\" Recurse Force
```

 9.3 Failure Recovery & Disaster Recovery Procedures
1. Database Backup: The SQLite database file resides at `backend/nutriplan.db`. Periodic snapshots can be taken by copying this single binary file while the system is idle.
2. Fresh Reinitialization: To reseed the system from scratch with default administrator accounts and reference libraries, remove `backend/nutriplan.db` and launch `start.py`.



 10. Appendix & Glossary

 Glossary of Terms
 Atwater System: Standard nutritional conversion factors used to calculate metabolizable energy from protein ($4\text{ kcal/g}$), carbohydrate ($4\text{ kcal/g}$), and lipid/fat ($9\text{ kcal/g}$).
 Basal Metabolic Rate (BMR): The baseline rate of energy expenditure per unit time by endothermic animals at rest.
 CopyOnWrite (COW): Optimization strategy where shared resources remain common until a mutation request is made, at which point a private copy is created for the modifying actor.
 Decoupled Architecture: Design pattern separating the presentation client from backend business logic via standardized REST HTTP interfaces.
 JWT (JSON Web Token): Compact, URLsafe means of representing claims to be transferred between two parties.
 MifflinSt Jeor Formula: Validated mathematical equation for calculating human BMR based on body mass, height, age, and sex.
 RBAC (RoleBased Access Control): Policyneutral access control mechanism defined around roles and privileges.
 TDEE (Total Daily Energy Expenditure): Total number of calories burned in a 24hour period factoring in physical activity multiplier.



 Signoff & Document Approval

 Role  Name  Signature  Date 

 Lead Architect  Google DeepMind / Antigravity Engineering  Approved  August 23, 2026 
 System Lead  S Navadeep  Approved  August 23, 2026 
 QA / Release  NutriPlan Verification Core  Verified  August 23, 2026 


End of IEEE Standard Document — NutriPlan System Specification

