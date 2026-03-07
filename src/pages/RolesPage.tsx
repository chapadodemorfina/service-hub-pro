import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const roles = [
  { key: "admin", label: "Administrador", description: "Acesso total ao sistema" },
  { key: "manager", label: "Gerente", description: "Gestão operacional" },
  { key: "front_desk", label: "Recepção", description: "Atendimento e abertura de OS" },
  { key: "bench_technician", label: "Técnico de Bancada", description: "Reparos e diagnósticos" },
  { key: "field_technician", label: "Técnico de Campo", description: "Atendimento externo" },
  { key: "finance", label: "Financeiro", description: "Gestão financeira" },
  { key: "collection_point_operator", label: "Operador Ponto de Coleta", description: "Gestão de coletas" },
  { key: "customer", label: "Cliente", description: "Portal do cliente" },
];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfis de Acesso</h1>
        <p className="text-muted-foreground">Perfis de acesso disponíveis no sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell><Badge variant="outline">{r.key}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
