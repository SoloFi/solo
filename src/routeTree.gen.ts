/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as AuthImport } from './routes/_auth'
import { Route as AppImport } from './routes/_app'
import { Route as AppIndexImport } from './routes/_app/index'
import { Route as AuthSignUpImport } from './routes/_auth/signUp'
import { Route as AuthSignInImport } from './routes/_auth/signIn'
import { Route as AppPortfoliosImport } from './routes/_app/portfolios'
import { Route as AppPortfolioPortfolioIdImport } from './routes/_app/portfolio.$portfolioId'

// Create/Update Routes

const AuthRoute = AuthImport.update({
  id: '/_auth',
  getParentRoute: () => rootRoute,
} as any)

const AppRoute = AppImport.update({
  id: '/_app',
  getParentRoute: () => rootRoute,
} as any)

const AppIndexRoute = AppIndexImport.update({
  path: '/',
  getParentRoute: () => AppRoute,
} as any)

const AuthSignUpRoute = AuthSignUpImport.update({
  path: '/signUp',
  getParentRoute: () => AuthRoute,
} as any)

const AuthSignInRoute = AuthSignInImport.update({
  path: '/signIn',
  getParentRoute: () => AuthRoute,
} as any)

const AppPortfoliosRoute = AppPortfoliosImport.update({
  path: '/portfolios',
  getParentRoute: () => AppRoute,
} as any)

const AppPortfolioPortfolioIdRoute = AppPortfolioPortfolioIdImport.update({
  path: '/portfolio/$portfolioId',
  getParentRoute: () => AppRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_app': {
      id: '/_app'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AppImport
      parentRoute: typeof rootRoute
    }
    '/_auth': {
      id: '/_auth'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthImport
      parentRoute: typeof rootRoute
    }
    '/_app/portfolios': {
      id: '/_app/portfolios'
      path: '/portfolios'
      fullPath: '/portfolios'
      preLoaderRoute: typeof AppPortfoliosImport
      parentRoute: typeof AppImport
    }
    '/_auth/signIn': {
      id: '/_auth/signIn'
      path: '/signIn'
      fullPath: '/signIn'
      preLoaderRoute: typeof AuthSignInImport
      parentRoute: typeof AuthImport
    }
    '/_auth/signUp': {
      id: '/_auth/signUp'
      path: '/signUp'
      fullPath: '/signUp'
      preLoaderRoute: typeof AuthSignUpImport
      parentRoute: typeof AuthImport
    }
    '/_app/': {
      id: '/_app/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof AppIndexImport
      parentRoute: typeof AppImport
    }
    '/_app/portfolio/$portfolioId': {
      id: '/_app/portfolio/$portfolioId'
      path: '/portfolio/$portfolioId'
      fullPath: '/portfolio/$portfolioId'
      preLoaderRoute: typeof AppPortfolioPortfolioIdImport
      parentRoute: typeof AppImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  AppRoute: AppRoute.addChildren({
    AppPortfoliosRoute,
    AppIndexRoute,
    AppPortfolioPortfolioIdRoute,
  }),
  AuthRoute: AuthRoute.addChildren({ AuthSignInRoute, AuthSignUpRoute }),
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_app",
        "/_auth"
      ]
    },
    "/_app": {
      "filePath": "_app.tsx",
      "children": [
        "/_app/portfolios",
        "/_app/",
        "/_app/portfolio/$portfolioId"
      ]
    },
    "/_auth": {
      "filePath": "_auth.tsx",
      "children": [
        "/_auth/signIn",
        "/_auth/signUp"
      ]
    },
    "/_app/portfolios": {
      "filePath": "_app/portfolios.tsx",
      "parent": "/_app"
    },
    "/_auth/signIn": {
      "filePath": "_auth/signIn.tsx",
      "parent": "/_auth"
    },
    "/_auth/signUp": {
      "filePath": "_auth/signUp.tsx",
      "parent": "/_auth"
    },
    "/_app/": {
      "filePath": "_app/index.tsx",
      "parent": "/_app"
    },
    "/_app/portfolio/$portfolioId": {
      "filePath": "_app/portfolio.$portfolioId.tsx",
      "parent": "/_app"
    }
  }
}
ROUTE_MANIFEST_END */
