const DEFAULT_ADMIN_ROUTE = '/admin/dashboard'

export function resolvePostLoginRedirect(redirect: unknown): string {
  if (typeof redirect !== 'string' || !redirect.startsWith('/admin')) {
    return DEFAULT_ADMIN_ROUTE
  }

  if (redirect.startsWith('//')) {
    return DEFAULT_ADMIN_ROUTE
  }

  return redirect
}
