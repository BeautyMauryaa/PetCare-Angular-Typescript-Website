# PetCare — Angular & TypeScript Website

A pet-care website built with Angular and TypeScript. The app includes pages and components for browsing products, viewing veterinary services, checking vaccination information, managing a profile, and using a shopping/cart flow.

## Features

- Home, About, and Contact pages
- Authentication page and dashboard
- Product/shop browsing with item routes
- Cart and checkout components
- Profile and order-tracking pages
- Vet and vaccine information pages
- Reusable navigation, product, and vet components

## Tech stack

- Angular 20
- TypeScript
- Angular Material and CDK
- RxJS

## Run locally

Requires Node.js compatible with your installed Angular version and npm.

```bash
npm install
npm start
```

Open the local URL printed by the Angular CLI (usually [http://localhost:4200](http://localhost:4200)).

Create a production build with:

```bash
npm run build
```

## Project structure

- `src/app/pages/` — routed pages such as home, shop, profile, vets, and vaccines
- `src/app/components/` — reusable UI components
- `src/app/services/` — application services
- `src/app/app.routes.ts` — client-side routes

## Status

This is a frontend project. Before describing it as a complete production application, verify the API integration, authentication behavior, checkout flow, and any data persistence expected by the UI.

## Author

**Beauty Mauryaa** · [GitHub](https://github.com/BeautyMauryaa)
