import type { IconName } from "@/components/ui/icons";
import type { DueState } from "./helpers";
import type { ChecklistCategory, ChecklistPriority, ReservationStatus, ReservationType } from "./types";

export const reservationTypeLabels: Record<ReservationType, string> = { accommodation: "Alojamento", restaurant: "Restaurante", attraction_activity: "Atração ou atividade", event: "Evento", rental: "Aluguer", transfer: "Transfer", transport_reference: "Referência de transporte", other: "Outro" };
export const reservationTypeIcons: Record<ReservationType, IconName> = { accommodation: "bed", restaurant: "sparkles", attraction_activity: "compass", event: "ticket", rental: "car", transfer: "bus", transport_reference: "plane", other: "file" };
export const reservationStatusLabels: Record<ReservationStatus, string> = { planned: "Planeada", booked: "Reservada", cancelled: "Cancelada", completed: "Concluída" };
export const checklistCategoryLabels: Record<ChecklistCategory, string> = { booking: "Reservas", documents: "Documentos", money: "Dinheiro", packing: "Bagagem", health_safety: "Saúde e segurança", connectivity: "Conectividade", transport: "Transportes", accommodation: "Alojamento", activities: "Atividades", other: "Outro" };
export const dueStateLabels: Record<DueState, string> = { completed: "Concluída", overdue: "Em atraso", due_today: "Termina hoje", upcoming: "Por fazer", none: "Sem prazo" };
export const checklistPriorityLabels: Record<ChecklistPriority, string> = { high: "Alta", medium: "Média", low: "Baixa" };
