import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CollectionPointForm from "../components/CollectionPointForm";
import { useCreateCollectionPoint } from "../hooks/useCollectionPoints";

export default function CollectionPointCreatePage() {
  const navigate = useNavigate();
  const create = useCreateCollectionPoint();

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader><CardTitle>Novo Ponto de Coleta</CardTitle></CardHeader>
        <CardContent>
          <CollectionPointForm
            isLoading={create.isPending}
            onSubmit={async (data) => {
              const result = await create.mutateAsync(data);
              navigate(`/collection-points/${result.id}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
