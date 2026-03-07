import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerAddress, AddressFormData, addressSchema } from "../types";
import { useSaveAddress, useDeleteAddress } from "../hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Props {
  customerId: string;
  addresses: CustomerAddress[];
}

export function AddressSection({ customerId, addresses }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const saveAddress = useSaveAddress();
  const deleteAddress = useDeleteAddress();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: "Principal", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "", is_default: false },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ label: "Principal", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "", is_default: false });
    setOpen(true);
  };

  const openEdit = (addr: CustomerAddress) => {
    setEditing(addr);
    form.reset({
      label: addr.label,
      street: addr.street ?? "",
      number: addr.number ?? "",
      complement: addr.complement ?? "",
      neighborhood: addr.neighborhood ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip_code: addr.zip_code ?? "",
      is_default: addr.is_default,
    });
    setOpen(true);
  };

  const onSubmit = (data: AddressFormData) => {
    saveAddress.mutate(
      { id: editing?.id, customerId, data },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereços</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Endereço" : "Novo Endereço"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-3 grid-cols-2">
                  <FormField control={form.control} name="label" render={({ field }) => (
                    <FormItem><FormLabel>Rótulo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="zip_code" render={({ field }) => (
                    <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="number" render={({ field }) => (
                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="complement" render={({ field }) => (
                    <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="neighborhood" render={({ field }) => (
                    <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} maxLength={2} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="is_default" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormLabel className="mt-0">Padrão</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="flex justify-end"><Button type="submit" disabled={saveAddress.isPending}>Salvar</Button></div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start justify-between rounded-md border p-3">
                <div className="text-sm space-y-0.5">
                  <div className="flex items-center gap-2 font-medium">
                    {a.label} {a.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                  </div>
                  <p className="text-muted-foreground">
                    {[a.street, a.number, a.complement, a.neighborhood].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-muted-foreground">{[a.city, a.state, a.zip_code].filter(Boolean).join(" - ")}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAddress.mutate({ id: a.id, customerId })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
