# maechaem-DB-v2.1.0 Data Architecture Documentation

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Data Flow](#data-flow)
6. [Technology Stack](#technology-stack)
7. [Authentication & Security](#authentication--security)
8. [Development Guide](#development-guide)

---

## Executive Summary

**maechaem-DB-v2.1.0** is a Progressive Web Application (PWA) designed for forest management and field data collection. It provides a complete system for recording, managing, and analyzing data about plots, trees, plant species, and growth surveys.

**Key Characteristics:**
- **Architecture**: Client-server with offline-first PWA capabilities
- **Frontend**: Modern React 18 with TypeScript
- **Backend**: Firebase ecosystem (Firestore, Cloud Functions, Cloud Storage, Authentication)
- **Database**: Firestore (NoSQL, document-based, asia-southeast1 region)
- **Primary Use Case**: Forest survey data collection and management system
- **Core Feature**: Offline support with automatic synchronization when connectivity returns

---

## Project Overview

### Purpose

The system enables forestry professionals to:
- Manage forest plots with geographical and measurement data
- Record detailed tree information with species classification
- Log growth surveys and measurements (height, DBH, bamboo culms, banana yield, etc.)
- Track historical changes with temporal data
- Collaborate on data collection with role-based access control
- Work offline in remote forest locations

### Project Structure

```
maechaem-DB-v2.1.0/
├── src/                          # Frontend React application
│   ├── components/               # UI components organized by feature
│   │   ├── auth/                 # Login, registration, profile
│   │   ├── admin/                # User approval, species management
│   │   ├── dashboard/            # Analytics and overview
│   │   ├── growth/               # Growth survey recording
│   │   ├── images/               # Image gallery and uploads
│   │   ├── layout/               # Navigation and UI shell
│   │   ├── plots/                # Plot management and listing
│   │   ├── survey/               # Survey management
│   │   └── trees/                # Tree management and details
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext           # User authentication state
│   │   ├── DatabaseContext       # Firestore service provider
│   │   └── OfflineContext        # Online/offline status
│   ├── hooks/                    # Custom React hooks for data
│   │   ├── useAuth               # User authentication
│   │   ├── useGrowthLogs         # Growth data queries
│   │   ├── usePlots              # Plot data queries
│   │   ├── useTrees              # Tree data queries
│   │   ├── useSpecies            # Species data queries
│   │   └── useOfflineSync        # Offline synchronization
│   ├── lib/                      # Utility functions and services
│   │   ├── firebase.ts           # Firebase configuration
│   │   ├── database.types.ts     # TypeScript interfaces
│   │   └── database/
│   │       └── firestoreService.ts  # Database service layer
│   ├── pages/                    # Route pages (using react-router)
│   ├── App.tsx                   # Router configuration
│   └── main.tsx                  # React entry point
├── functions/                    # Firebase Cloud Functions (Node.js)
│   └── src/
│       └── index.ts              # Cloud function handlers
├── public/                       # Static assets
│   ├── manifest.json             # PWA manifest
│   ├── service-worker.js         # Service worker for offline
│   └── icons/                    # App icons
├── dataconnect/                  # Firebase Data Connect (optional)
├── docs/                         # Documentation
│   └── firestore_structure.md    # Database structure reference
├── firestore.rules               # Firestore security rules
├── firebase.json                 # Firebase configuration
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
```

---

## System Architecture

### Layered Architecture

The system follows a **4-tier layered architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: PRESENTATION LAYER                                    │
│  React Components & Pages                                       │
│  - UI Components (Plots, Trees, Survey, Admin, Dashboard)      │
│  - React Router for navigation                                  │
│  - Tailwind CSS for styling                                    │
│  - Leaflet maps for spatial visualization                      │
│  - Recharts for data visualization                             │
└─────────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: STATE MANAGEMENT & CONTEXT LAYER                     │
│  React Context API Providers                                    │
│  - AuthContext: User authentication & profile                  │
│  - DatabaseContext: Firestore service injection                │
│  - OfflineContext: Connection status tracking                  │
│  - Custom Hooks: Data fetching & business logic                │
└─────────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: DATA ACCESS LAYER                                     │
│  Custom Hooks & Service Layer                                   │
│  - useAuth, usePlots, useTrees, useSpecies, useGrowthLogs      │
│  - firestoreService: Abstraction over Firebase SDK             │
│  - Query builders & data transformers                          │
│  - Offline sync queue management                               │
└─────────────────────────────────────────────────────────────────┘
                           ↓↑
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: BACKEND SERVICES                                      │
│  Firebase & Cloud Services                                      │
│  - Firebase Authentication                                      │
│  - Cloud Firestore Database (asia-southeast1)                  │
│  - Cloud Storage (image uploads)                               │
│  - Cloud Functions (business logic, triggers)                  │
│  - Cloud Pub/Sub (event-driven features, optional)             │
└─────────────────────────────────────────────────────────────────┘
```

### PWA & Offline Architecture

The system implements **Progressive Web App** capabilities for offline-first operation:

```
┌────────────────────────────────────────────────────────────────┐
│  SERVICE WORKER                                                │
│  - Caches app shell (HTML, CSS, JS)                           │
│  - Intercepts network requests                                │
│  - Manages offline/online transitions                         │
└────────────────────────────────────────────────────────────────┘
                           ↓↑
┌────────────────────────────────────────────────────────────────┐
│  CLIENT-SIDE PERSISTENCE                                       │
│  - Firestore IndexedDB: Automatic local caching               │
│  - localStorage (optional): Offline action queue              │
│  - Browser cache: Static asset caching                        │
└────────────────────────────────────────────────────────────────┘
                           ↓↑
┌────────────────────────────────────────────────────────────────┐
│  NETWORK SYNCHRONIZATION                                       │
│  - Detects connection restoration                             │
│  - Queues offline changes via Firestore                       │
│  - Automatic retry & conflict resolution                      │
│  - User notification on sync completion                       │
└────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Overview

Cloud Firestore is organized into **12 collections** with document-based structure:

| Collection | Purpose | Record Type |
|-----------|---------|------------|
| **profiles** | User accounts & roles | Master data |
| **plots** | Forest study areas | Master data |
| **trees** | Individual tree records | Master data |
| **species** | Plant species definitions | Reference data |
| **growth_logs** | Survey records per tree | Transactional |
| **growth_dbh** | DBH measurements | Transactional |
| **growth_bamboo** | Bamboo-specific data | Transactional |
| **growth_banana** | Banana-specific data | Transactional |
| **plot_images** | Plot photographs | Media metadata |
| **plot_spacing** | Tree spacing measurements | Measurement data |
| **comments** | Survey annotations | Transactional |
| **notifications** | User notifications | Transactional |

### Collection Details

#### 1. **profiles** Collection
User accounts with roles and approval status.

**Document ID**: Firebase UID
**Key Fields**:
```
{
  id: string                    // Firebase UID
  email: string                 // User email (indexed)
  fullname: string              // User display name
  position: string              // Job title (e.g., "Researcher", "Technician")
  organization: string          // Organization name
  role: string                  // Enum: pending | staff | researcher | executive | external | admin
  approved: boolean             // Approval status (only admins can approve)
  created_at: timestamp         // Account creation date
}
```

**Access Control**:
- Users can read/update their own profile
- Admins can read all profiles
- Only admins can set `role` and `approved`

**Indexes**: email (ascending)

---

#### 2. **plots** Collection
Forest study areas with geospatial and descriptive data.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  plot_code: string             // Human-readable plot identifier (indexed)
  name_short: string            // Short plot name
  owner_name: string            // Primary researcher/owner
  group_number: number          // Plot grouping/batch number
  area_sq_m: number             // Plot area in square meters
  tambon: string                // Thai administrative subdivision
  elevation_m: number           // Elevation in meters
  boundary_geojson: object      // GeoJSON polygon for plot boundary
  note: string                  // Additional notes
  created_at: timestamp         // Creation date

  // Denormalized fields (updated via Cloud Function triggers):
  tree_count: number            // Total trees in plot
  alive_count: number           // Count of alive trees
  latest_survey_date: timestamp // Most recent survey date
}
```

**Access Control**:
- Public read access
- Write restricted to approved staff/researcher/admin roles

**Indexes**: plot_code (ascending), created_at (descending)

**Notes**:
- `boundary_geojson` enables spatial queries and map visualization
- Denormalized fields improve dashboard query performance
- Cloud Functions update counters on tree/survey changes

---

#### 3. **trees** Collection
Individual tree records linked to plots.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  tree_code: string             // Human-readable tree identifier (indexed)
  plot_id: string               // FK to plots collection (indexed)
  species_id: string            // FK to species collection (indexed)
  tree_number: number           // Sequential number within plot
  tag_label: string             // Physical tree tag/label
  row_main: number              // Main row coordinate
  row_sub: number               // Sub-row coordinate
  utm_x: number                 // UTM X coordinate
  utm_y: number                 // UTM Y coordinate
  geom: object                  // GeoJSON point for tree location
  grid_spacing: number          // Grid spacing in meters
  note: string                  // Additional notes
  created_at: timestamp         // Creation date
}
```

**Access Control**:
- Public read access
- Write restricted to approved staff/researcher/admin roles

**Indexes**:
- tree_code (ascending)
- plot_id (ascending, for efficient plot tree queries)
- species_id (ascending)

**Notes**:
- Spatial coordinates support mapping and spatial analysis
- `geom` field is a GeoJSON point for Firestore geo queries
- Trees are immutable once created (updates via surveys only)

---

#### 4. **species** Collection
Plant species reference data with taxonomic information.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  species_code: string          // Species code/identifier (indexed)
  species_group: string         // Enum: A | B (grouping category)
  group_label: string           // Human-readable group name
  plant_category: string        // Enum: forest | rubber | bamboo | fruit | banana
  name_th: string               // Thai name
  name_en: string               // English name
  name_sci: string              // Scientific name
  hex_color: string             // UI color code (for map visualization)
  created_at: timestamp         // Creation date
}
```

**Access Control**:
- Public read access
- Write restricted to admin role only

**Indexes**: species_code (ascending)

**Notes**:
- Master data for classification
- Color coding enables visual distinction in UI
- Categories enable species-specific growth data (bamboo, banana, standard)

---

#### 5. **growth_logs** Collection
Survey records for tree measurements and observations.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  tree_id: string               // FK to trees collection (indexed)
  survey_date: date             // Date of survey (indexed)
  recorder_id: string           // FK to profiles (user who recorded)
  height_m: number              // Tree height in meters
  status: string                // Enum: alive | dead | missing
  flowering: boolean            // Flowering status
  note: string                  // Survey notes
  synced_from: string           // Source system identifier (for migrations)
  created_at: timestamp         // Record creation timestamp
}
```

**Access Control**:
- Public read access
- Write restricted to approved staff/researcher/admin roles

**Indexes**:
- tree_id (ascending, for tree history queries)
- survey_date (descending, for recent surveys)
- Composite: tree_id + survey_date (for efficient history)

**Notes**:
- Forms the core transactional data
- Multiple surveys per tree tracked over time
- Supports temporal analysis and change tracking

---

#### 6. **growth_dbh** Collection
Diameter at Breast Height (DBH) measurements - linked to growth_logs.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  growth_log_id: string         // FK to growth_logs (indexed)
  dbh_cm: number                // DBH in centimeters
}
```

**Access Control**: Same as growth_logs

**Indexes**: growth_log_id (ascending)

**Design Note**:
- Separate collection to handle tree-specific measurements
- Standard trees use growth_dbh
- Allows multiple DBH measurements per survey if needed

---

#### 7. **growth_bamboo** Collection
Bamboo-specific growth data.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  growth_log_id: string         // FK to growth_logs (indexed)
  culm_count: number            // Number of bamboo culms
  dbh_1_cm: number              // First culm DBH in cm
  dbh_2_cm: number              // Second culm DBH in cm
  dbh_3_cm: number              // Third culm DBH in cm
}
```

**Access Control**: Same as growth_logs

**Notes**:
- Bamboo-specific measurement structure
- Multiple culms tracked per measurement
- Linked via growth_log_id for data integrity

---

#### 8. **growth_banana** Collection
Banana-specific yield and production data.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  growth_log_id: string         // FK to growth_logs (indexed)
  total_plants: number          // Total banana plants
  plants_1yr: number            // Plants less than 1 year old
  yield_bunches: number         // Yield in bunches
  yield_hands: number           // Yield in hands
  price_per_hand: number        // Economic value tracking
}
```

**Access Control**: Same as growth_logs

**Notes**:
- Economic crop data for agroforestry systems
- Tracks productivity and yield
- Price information for economic analysis

---

#### 9. **plot_images** Collection
Metadata for plot photographs and images.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  plot_id: string               // FK to plots (indexed)
  image_type: string            // Type of image (e.g., "overview", "detail")
  gallery_category: string      // Category for organization
  legacy_url: string            // Reference to old system URL (if migrated)
  storage_path: string          // Path in Cloud Storage
  description: string           // Image description
  uploaded_by: string           // FK to profiles (uploader)
  upload_date: date             // Upload date
  created_at: timestamp         // Record creation time
}
```

**Access Control**:
- Public read for metadata
- Write restricted to approved users

**Indexes**: plot_id (ascending)

**Storage**: Images stored in Cloud Storage bucket, path referenced in `storage_path`

---

#### 10. **plot_spacing** Collection
Tree spacing measurements within plots.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  plot_id: string               // FK to plots (indexed)
  avg_spacing: number           // Average spacing in meters
  min_spacing: number           // Minimum spacing in meters
  max_spacing: number           // Maximum spacing in meters
  tree_count: number            // Number of trees measured
  note: string                  // Measurement notes
  measured_date: date           // Measurement date
}
```

**Access Control**: Same as plots

**Notes**:
- Used for forestry spacing analysis
- Multiple measurements per plot allowed (one per survey period)

---

#### 11. **comments** Collection
Annotations and comments on survey records.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  growth_log_id: string         // FK to growth_logs (indexed)
  author_id: string             // FK to profiles (comment author)
  body: string                  // Comment text
  created_at: timestamp         // Comment timestamp
}
```

**Access Control**:
- Public read
- Write by approved users

---

#### 12. **notifications** Collection
User notifications for system events.

**Document ID**: Auto-generated
**Key Fields**:
```
{
  id: string                    // Document ID (unique)
  user_id: string               // FK to profiles (indexed)
  message: string               // Notification message
  read: boolean                 // Read status
  created_at: timestamp         // Notification time
}
```

---

### Data Relationships

```
profiles
  ↑
  ├─ owns plot (via created_by, implied)
  │   └─ contains multiple trees
  │       └─ has multiple growth_logs
  │           └─ references species_id
  │           └─ may have growth_dbh | growth_bamboo | growth_banana
  │           └─ may have comments
  │
  ├─ records growth_logs
  ├─ uploads plot_images
  └─ receives notifications

species (reference)
  ↓
  referenced by trees (species_id)
```

---

## Data Flow

### User Authentication & Authorization Flow

```
1. USER SIGNS UP
   └─ Email & password → Firebase Auth
      └─ Auth creates account & JWT token
         └─ Triggers Cloud Function: onUserCreated
            └─ Creates profile document in Firestore
               └─ First user → role: admin, approved: true
               └─ Subsequent users → role: pending, approved: false

2. USER LOGS IN
   └─ Email & password → Firebase Auth
      └─ Returns JWT token & UID
         └─ React App loads in AuthContext
            └─ Fetches user profile from Firestore
               └─ Sets app-wide auth state

3. AUTHORIZATION CHECK
   └─ Firestore Security Rules evaluate on each operation
      └─ Checks user.role and user.approved
         └─ Allows/denies write operations based on rules
            └─ UI disabled for unauthorized operations
```

### Plot & Tree Data Collection Flow

```
USER NAVIGATES TO PLOT
└─ usePlots() hook triggered
   └─ firestoreService.fetchPlots()
      └─ Firestore query: collection("plots").get()
         └─ Returns all plots (user readable)
            └─ React displays PlotsList component

USER OPENS PLOT DETAIL
└─ usePlots() fetches single plot
   └─ useTrees() fetches trees for plot_id
   └─ useGrowthLogs() fetches recent surveys
      └─ Components display PlotDetailPage
         └─ User can add new tree or record survey

USER ADDS SURVEY DATA (ONLINE)
└─ Growth form submitted
   └─ firestoreService.addGrowthLog()
      └─ Creates document in growth_logs collection
         └─ Triggers Cloud Function: onGrowthLogCreated
            └─ Updates denormalized fields in plots document
            └─ Increments counters
               └─ Real-time listener notifies other clients
                  └─ UI updates immediately

USER ADDS SURVEY DATA (OFFLINE)
└─ Growth form submitted
   └─ Service worker intercepts network request
      └─ Stores in localStorage/IndexedDB queue
         └─ Shows "offline" indicator to user
            └─ App continues functioning normally

CONNECTION RESTORED
└─ Service worker detects online status
   └─ Firestore IndexedDB persistence syncs
      └─ Queued changes uploaded to Firestore
         └─ Cloud Functions process as if online
            └─ User notified on sync completion
```

### Image Upload Flow

```
USER SELECTS IMAGE
└─ Image uploaded to Cloud Storage (firestoreService.uploadImage)
   └─ Returns storage URL
      └─ Creates metadata document in plot_images
         └─ Document references storage_path
            └─ Images displayed via Cloud Storage URLs
```

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.2 | UI library |
| **Language** | TypeScript | 5.2+ | Type safety |
| **Build Tool** | Vite | 7 | Fast development & bundling |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS framework |
| **UI Components** | lucide-react | Latest | Icon library |
| **Routing** | react-router-dom | 7 | Client-side routing |
| **HTTP/Auth** | firebase | 12 | Firebase SDK |
| **Maps** | Leaflet + react-leaflet | Latest | Map visualization |
| **Charts** | Recharts | Latest | Data visualization |
| **CSV/Excel** | papaparse, read-excel-file | Latest | File import/export |
| **Coordinates** | proj4 | Latest | Coordinate conversion |
| **Testing** | Jest + React Testing Library | Latest | Unit & integration tests |

### Backend Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Cloud Firestore | Document database (NoSQL) |
| **Authentication** | Firebase Authentication | User auth & session management |
| **File Storage** | Cloud Storage | Image & document storage |
| **Serverless Functions** | Cloud Functions | Event-driven business logic |
| **Events** | Cloud Pub/Sub | Optional: event-driven patterns |
| **Region** | asia-southeast1 (Bangkok) | Data location for latency optimization |

### DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Hosting** | Firebase Hosting | Static site hosting |
| **Package Manager** | npm | Dependency management |
| **Runtime** | Node.js 20+ | Cloud Functions runtime |
| **Version Control** | Git | Source control |
| **PWA** | Service Worker, Web Manifest | Offline capabilities |
| **Cache** | Service Worker Cache API | App shell caching |
| **Persistence** | IndexedDB | Local data storage |

---

## Authentication & Security

### Authentication Architecture

**Firebase Authentication** handles:
- Email/password registration and login
- Password reset via email
- Session management via JWT tokens
- User UID generation

**Profile System**:
- First user automatically becomes admin
- Subsequent users require approval
- Roles: admin, staff, researcher, executive, external, pending

### Authorization & Access Control

**User Roles**:

| Role | Read | Write Plots | Write Trees | Record Survey | Approve Users | Edit Species |
|------|------|------------|------------|--------------|---------------|--------------|
| **admin** | All | ✓ | ✓ | ✓ | ✓ | ✓ |
| **staff** | All | ✓ | ✓ | ✓ | ✗ | ✗ |
| **researcher** | All | ✓ | ✓ | ✓ | ✗ | ✗ |
| **executive** | All | ✗ | ✗ | ✗ | ✗ | ✗ |
| **external** | Limited | ✗ | ✗ | ✗ | ✗ | ✗ |
| **pending** | None | ✗ | ✗ | ✗ | ✗ | ✗ |

**Firestore Security Rules**:
- Located in `/firestore.rules`
- Enforces row-level access control
- Validates role and approval status on write operations
- Prevents unapproved users from modifying data

**Cloud Storage Security**:
- Image uploads restricted to approved users
- Metadata stored in Firestore (audit trail)

### Data Protection

- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: Firestore encryption by default
- **Sensitive Data**: None stored in plaintext (passwords hashed by Firebase)

---

## Development Guide

### Prerequisites

```bash
Node.js 20+
npm 9+
Firebase project with:
  - Authentication enabled
  - Firestore database created (asia-southeast1)
  - Cloud Storage bucket
  - Cloud Functions deployed
```

### Environment Setup

Create `.env.local` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_SITE_URL=http://localhost:5173
VITE_USE_FIREBASE_EMULATOR=true  # For local development
```

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server (with Firestore emulator)
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

### Key Development Files

- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/database/firestoreService.ts` - Database operations
- `src/contexts/DatabaseContext.tsx` - Database provider
- `src/hooks/` - Custom data hooks
- `functions/src/index.ts` - Cloud Functions
- `firestore.rules` - Security rules
- `firestore.indexes.json` - Database indexes

### Development Workflow

1. **Create branch** from `main` or develop branch
2. **Make changes** to components, hooks, or services
3. **Test locally** with Firestore emulator
4. **Commit** with descriptive messages
5. **Push** and create pull request
6. **Deploy** to Firebase after review

---

## Conclusion

The maechaem-DB-v2.1.0 architecture provides a robust, scalable foundation for forest management and field data collection. Its modern tech stack, offline-first approach, and comprehensive security controls make it suitable for deployment in remote areas with intermittent connectivity while maintaining data integrity and user privacy.

The layered architecture separates concerns effectively, allowing independent scaling of components. The Firebase ecosystem provides managed services that reduce operational overhead, and the PWA approach ensures accessibility across devices and network conditions.
