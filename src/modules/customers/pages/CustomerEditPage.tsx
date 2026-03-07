import { useNavigate, useParams } from "react-router-dom";
import { useCustomer, useUpdateCustomer } from "../hooks/useCustomers";
import { CustomerForm } from "../components/CustomerForm";
import { CustomerFormData } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id);
  const updateCustomer = useUpdateCustomer();

  const onSubmit = (data: CustomerFormData) => {
    if (!id) return;
    updateCustomer.mutate({ id, data }, {
      onSuccess: () => navigate(`/customers/${id}`),
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!customer) {
    return <p className="text-center text-muted-foreground py-12">Cliente não encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/customers/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">{customer.full_name}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
        <CardContent>
          <CustomerForm defaultValues={customer} onSubmit={onSubmit} loading={updateCustomer.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
