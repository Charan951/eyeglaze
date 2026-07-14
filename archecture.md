# System Architecture Document: EyeGlaze

## 1. System Overview & Data Flow
EyeGlaze utilizes a decoupled Client-Server architecture designed for high availability, low cost, and fast content delivery. The platform comprises a React Single Page Application (SPA), an Express.js REST API with real-time WebSocket capabilities, a MongoDB database, and a Flutter mobile application.

```mermaid
graph TD
    ClientWeb[Vite/React SPA Client]
    ClientMobile[Flutter Mobile Client]
    
    subgraph Infrastructure [AWS EC2 / Ubuntu]
        Nginx[Nginx Reverse Proxy]
        PM2[PM2 Process Manager]
        Express[Node.js / Express Server]
        Redis[Redis Session/Cache Store]
    end
    
    subgraph Databases & Storage
        MongoDB[(MongoDB Database)]
        S3[(AWS S3 / Cloudinary)]
    end
    
    subgraph External Services
        OTP[SMS & Email OTP Gateways]
    end
    
    ClientWeb -->|HTTPS / WSS| Nginx
    ClientMobile -->|HTTP / WSS| Nginx
    
    Nginx -->|Proxy Pass /api| Express
    Nginx -->|Proxy Pass /socket.io| Express
    Nginx -->|Static files| StaticRoot[/var/www/eyeglaze]
    
    PM2 -->|Manages & Restarts| Express
    Express -->|Read/Write| MongoDB
    Express -->|Cache Sessions| Redis
    Express -->|Upload Media| S3
    Express -->|Trigger OTPs| OTP
```

---

## 2. Frontend Technology Stack
* **Core Framework:** React 19 + TypeScript + Vite.
* **Routing:** React Router v7 (configured with nested layout routes, protected routes, and scroll-to-top behavior).
* **Styling:** Tailwind CSS v4.0.
  * Employs Tailwind v4's CSS-first theme engine (`@theme` in `src/index.css`) rather than `tailwind.config.js`.
  * Customized theme variables include corporate branding gold (`#D4A04D`), dark slate background (`#0B0B0C`), and bespoke card styling.
* **State Management & Forms:** React Context API (e.g. `AuthContext`), React Hook Form, and Zod resolver validation.
* **Animations:** Framer Motion for modern, hardware-accelerated transitions, fade-ins, slide-ins, and scale-ups.
* **Real-time Comms:** Socket.io Client for the user support interface.
* **Device Access & Video Scanner:** WebRTC API (`getUserMedia`) for local camera streams, enabling simulated eye/pupil tracking overlays without server overhead.

---

## 3. Backend Technology Stack
* **Execution Environment:** Node.js + TypeScript (run via `tsx` compiler in development and compiled to JS using `tsc` for production).
* **API Framework:** Express.js (supporting CORS with dynamic emulator loopback, secure cookies via `cookie-parser`, and JSON payloads).
* **Database Access:** Mongoose (MongoDB Object Document Mapper) providing schema modeling, index setups, and query aggregation.
* **Session & Caching:** Redis Client (`redis` NPM package) storing hashed refresh tokens mapped to active user sessions.
* **Real-time Comms:** Socket.io server layer bound to the Express HTTP Server to facilitate real-time chat between support agents and customers.
* **Media Upload Handling:** AWS SDK S3 client and Cloudinary integration, utilizing `multer` as the multipart file upload middleware.
* **Validations:** Zod schema validation validating client request bodies.

---

## 4. Database Schema Design (Key Collections)
* **User (`User`):** Stores account details, hashed passwords, verified credentials, wallet balances, active VIP memberships, and saved shipping addresses.
* **Session (`Session`):** Tracks active device logins. Links `userId`, hashed refresh tokens, IP addresses, and user-agent strings. Used for session invalidation.
* **Product & Variant (`Product`, `ProductVariant`):** Stores detailed frame dimensions, styles, pricing, category paths, and variant configurations (colors/sizes).
* **Lens Options & Lens Types (`Lens`, `LensOption`, `LensType`):** Catalogs prescription lens selections and upgrades (e.g. anti-glare, blue cut) and their associated pricing.
* **Prescription (`Prescription` / Saved Powers):** Stores optical parameters (Spherical, Cylindrical, Axis, Pupil Distance, and Addition) for user accounts.
* **Order (`Order`):** Records completed sales, shipping information, order status, lens selection specifics, applied coupons, and wallet cashback details.
* **Coupon & Analytics (`Coupon`, `CouponUsage`, `CouponAnalytics`):** Manages coupon rules, validation schemas, total/per-user usage counters, and campaign metrics.
* **Ticket (`Ticket`):** Standardizes support requests and tracks active conversation threads.

---

## 5. Hosting & CI/CD Deployment Architecture
EyeGlaze is deployed on **Amazon Web Services (AWS)** using a cost-efficient dynamic scaling architecture orchestrated by **Jenkins**:

1. **Host Server:** AWS EC2 Instance running Ubuntu in the `ap-south-1` (Mumbai) region.
2. **Dynamic Scaling Build Pipeline:**
   * To prevent high hosting costs, the server normally runs on a small **`t3.micro`** instance.
   * When a deployment is triggered, the Jenkins pipeline uses the AWS CLI to temporarily stop the instance, change its type to a high-capacity **`c7i-flex.large`**, and start it.
   * This provides the CPU and memory capacity required to install dependencies and execute Vite builds.
3. **Build & Deploy Steps:**
   * Pulls the latest code from Git.
   * Installs server node modules and builds TypeScript to JS.
   * Installs frontend node modules and runs `vite build`.
   * Cleans `/var/www/eyeglaze` and copies new frontend static assets.
   * Restarts the Node backend process inside **PM2**.
   * Validates the Nginx config (`nginx -t`) and reloads/restarts the Nginx service.
4. **Scale Down Step:**
   * Once Nginx successfully reloads, Jenkins stops the EC2 instance, reverts it back to a **`t3.micro`** instance, and restarts it.
