import ServiceOrderForm from "../components/ServiceOrderForm";

export default function ServiceOrderCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nova Ordem de Serviço</h1>
        <p className="text-muted-foreground">Registre um novo atendimento</p>
      </div>
      <ServiceOrderForm />
    </div>
  );
}
