import { useRef } from "react";
import { useOrderAttachments, useUploadAttachment, useDeleteAttachment, getAttachmentUrl } from "../hooks/useServiceOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, FileIcon, Image } from "lucide-react";

interface Props {
  orderId: string;
}

export default function AttachmentUpload({ orderId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isLoading } = useOrderAttachments(orderId);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadMutation.mutateAsync({ orderId, file });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const isImage = (type: string | null) => type?.startsWith("image/");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Anexos e Evidências</CardTitle>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
          <Upload className="mr-1 h-4 w-4" /> Enviar
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} accept="image/*,application/pdf" />
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!attachments?.length && !isLoading && <p className="text-sm text-muted-foreground">Nenhum anexo.</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {attachments?.map((att) => (
            <div key={att.id} className="relative group border rounded-md overflow-hidden">
              {isImage(att.file_type) ? (
                <img src={getAttachmentUrl(att.storage_path)} alt={att.file_name} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 flex items-center justify-center bg-muted">
                  <FileIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="p-1.5">
                <p className="text-xs truncate">{att.file_name}</p>
              </div>
              <Button
                variant="destructive" size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate({ id: att.id, orderId, storagePath: att.storage_path })}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
