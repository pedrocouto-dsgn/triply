const messages: Record<string, string> = {
  destinationAdded: "Destino adicionado com sucesso.", destinationUpdated: "Destino atualizado com sucesso.",
  destinationDeleted: "Destino eliminado e rota reconciliada.", routeReordered: "Nova ordem guardada; transportes afetados foram preservados para revisão.",
  transportAdded: "Transporte adicionado com sucesso.", transportUpdated: "Transporte atualizado com sucesso.", transportDeleted: "Transporte eliminado com sucesso.",
};
export function RouteStatus({ query }: { query: Record<string, string | string[] | undefined> }) {
  const key = Object.keys(messages).find((item) => query[item]);
  const warning = query.budgetSync === "0" ? <p role="alert" className="mt-3 rounded-control border border-warning bg-warning-muted p-4 text-sm font-medium text-warning">O transporte foi guardado, mas não foi possível atualizar o valor da passagem nos gastos. Edite o transporte e guarde novamente.</p> : null;
  return key ? <><p role="status" className="mt-6 rounded-control border border-success bg-success-muted p-4 text-sm font-medium text-success">{messages[key]}</p>{warning}</> : warning;
}
