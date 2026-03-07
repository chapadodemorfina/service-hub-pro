import { useNavigate } from "react-router-dom";
import { useCreateCustomer } from "../hooks/useCustomers";
import { CustomerForm } from "../components/CustomerForm";
import { CustomerFormData } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const createCustomer = useCreateCustomer();

  const onSubmit = (data: CustomerFormData) => {
    createCustomer.mutate(data, {
      onSuccess: (customer) => navigate(`/customers/${customer.id}`),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">Cadastre um novo cliente no sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
          <CardDescription>Preencha as informações básicas do cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerForm onSubmit={onSubmit} loading={createCustomer.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
