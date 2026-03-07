import { useParams, useNavigate } from "react-router-dom";
import { useServiceOrder } from "../hooks/useServiceOrders";
import ServiceOrderForm from "../components/ServiceOrderForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useServiceOrder(id);
  const navigate = useNavigate();

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  if (!order) return <p className="text-center py-12 text-muted-foreground">OS não encontrada.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Editar {order.order_number}</h1>
        <p className="text-muted-foreground">Atualize os dados da ordem de serviço</p>
      </div>
      <ServiceOrderForm initialData={order} />
    </div>
  );
}
