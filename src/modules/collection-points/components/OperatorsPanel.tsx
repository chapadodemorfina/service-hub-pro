import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useCollectionPointUsers, useAddCollectionPointUser, useRemoveCollectionPointUser,
} from "../hooks/useCollectionPoints";

export default function OperatorsPanel({ cpId }: { cpId: string }) {
  const { data: users, isLoading } = useCollectionPointUsers(cpId);
  const addUser = useAddCollectionPointUser();
  const removeUser = useRemoveCollectionPointUser();
  const [userId, setUserId] = useState("");

  const handleAdd = async () => {
    if (!userId.trim()) return;
    await addUser.mutateAsync({ collectionPointId: cpId, userId: userId.trim() });
    setUserId("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="ID do usuário (UUID)"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="max-w-sm"
        />
        <Button size="sm" onClick={handleAdd} disabled={addUser.isPending}>
          <UserPlus className="h-4 w-4 mr-1" /> Vincular
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : !users?.length ? (
        <p className="text-muted-foreground text-sm">Nenhum operador vinculado.</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between border rounded-md px-3 py-2">
              <div>
                <span className="font-medium">{u.profiles?.full_name || "Usuário"}</span>
                <span className="text-sm text-muted-foreground ml-2">{u.profiles?.email}</span>
                {!u.is_active && <Badge variant="secondary" className="ml-2">Inativo</Badge>}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeUser.mutate(u.id)}
                disabled={removeUser.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
