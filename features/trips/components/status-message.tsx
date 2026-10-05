import { Notice } from "@/components/ui/page";

const messages: Record<string, string> = {
  created: "Viagem criada com sucesso.",
  updated: "Alterações guardadas com sucesso.",
  restored: "Viagem restaurada com sucesso.",
  archived: "Viagem arquivada com sucesso.",
  deleted: "Viagem eliminada permanentemente.",
};

export function StatusMessage({ kind }: { kind?: string }) {
  const message = kind ? messages[kind] : undefined;
  return message ? <Notice tone="success">{message}</Notice> : null;
}
