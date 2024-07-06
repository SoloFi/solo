/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as SignUpImport } from './routes/signUp'
import { Route as SignInImport } from './routes/signIn'
import { Route as layoutImport } from './routes/__layout'
import { Route as IndexImport } from './routes/index'

// Create/Update Routes

const SignUpRoute = SignUpImport.update({
  path: '/signUp',
  getParentRoute: () => rootRoute,
} as any)

const SignInRoute = SignInImport.update({
  path: '/signIn',
  getParentRoute: () => rootRoute,
} as any)

const layoutRoute = layoutImport.update({
  id: '/__layout',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/__layout': {
      id: '/__layout'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof layoutImport
      parentRoute: typeof rootRoute
    }
    '/signIn': {
      id: '/signIn'
      path: '/signIn'
      fullPath: '/signIn'
      preLoaderRoute: typeof SignInImport
      parentRoute: typeof rootRoute
    }
    '/signUp': {
      id: '/signUp'
      path: '/signUp'
      fullPath: '/signUp'
      preLoaderRoute: typeof SignUpImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  IndexRoute,
  SignInRoute,
  SignUpRoute,
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/__layout",
        "/signIn",
        "/signUp"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/__layout": {
      "filePath": "__layout.tsx"
    },
    "/signIn": {
      "filePath": "signIn.tsx"
    },
    "/signUp": {
      "filePath": "signUp.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
