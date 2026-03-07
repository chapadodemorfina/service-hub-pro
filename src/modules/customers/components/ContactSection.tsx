import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerContact, ContactFormData, contactSchema } from "../types";
import { useSaveContact, useDeleteContact } from "../hooks/useCustomers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Contact } from "lucide-react";

interface Props {
  customerId: string;
  contacts: CustomerContact[];
}

export function ContactSection({ customerId, contacts }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerContact | null>(null);
  const saveContact = useSaveContact();
  const deleteContact = useDeleteContact();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", role: "", phone: "", whatsapp: "", email: "", is_primary: false },
  });

  const openNew = () => {
    setEditing(null);
    form.reset({ name: "", role: "", phone: "", whatsapp: "", email: "", is_primary: false });
    setOpen(true);
  };

  const openEdit = (c: CustomerContact) => {
    setEditing(c);
    form.reset({
      name: c.name,
      role: c.role ?? "",
      phone: c.phone ?? "",
      whatsapp: c.whatsapp ?? "",
      email: c.email ?? "",
      is_primary: c.is_primary,
    });
    setOpen(true);
  };

  const onSubmit = (data: ContactFormData) => {
    saveContact.mutate({ id: editing?.id, customerId, data }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2"><Contact className="h-4 w-4" /> Contatos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-3 grid-cols-2">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="whatsapp" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="is_primary" render={({ field }) => (
                    <FormItem className="flex items-center gap-2"><FormLabel className="mt-0">Principal</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                  )} />
                </div>
                <div className="flex justify-end"><Button type="submit" disabled={saveContact.isPending}>Salvar</Button></div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-md border p-3">
                <div className="text-sm space-y-0.5">
                  <div className="flex items-center gap-2 font-medium">
                    {c.name} {c.is_primary && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                  </div>
                  {c.role && <p className="text-muted-foreground">{c.role}</p>}
                  <p className="text-muted-foreground">{[c.phone, c.email].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteContact.mutate({ id: c.id, customerId })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
