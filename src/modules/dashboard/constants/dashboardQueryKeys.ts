export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  clientes: () => [...dashboardQueryKeys.all, 'clientes'] as const,
  balones: () => [...dashboardQueryKeys.all, 'balones'] as const,
}
