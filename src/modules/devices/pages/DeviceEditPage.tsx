import { useNavigate, useParams } from "react-router-dom";
import { DeviceForm } from "../components/DeviceForm";
import { useDevice, useUpdateDevice } from "../hooks/useDevices";
import { Loader2 } from "lucide-react";

export default function DeviceEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: device, isLoading } = useDevice(id);
  const updateDevice = useUpdateDevice();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!device) return <p className="text-center py-12 text-muted-foreground">Dispositivo não encontrado</p>;

  const handleSubmit = async (data: any) => {
    await updateDevice.mutateAsync({ id: id!, data });
    navigate(`/devices/${id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar Dispositivo</h1>
        <p className="text-muted-foreground">{[device.brand, device.model].filter(Boolean).join(" ")}</p>
      </div>
      <DeviceForm
        defaultValues={{
          customer_id: device.customer_id,
          device_type: device.device_type,
          brand: device.brand || "",
          model: device.model || "",
          serial_number: device.serial_number || "",
          imei: device.imei || "",
          color: device.color || "",
          password_notes: device.password_notes || "",
          physical_condition: device.physical_condition || "",
          reported_issue: device.reported_issue || "",
          internal_notes: device.internal_notes || "",
          is_active: device.is_active,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateDevice.isPending}
        isEdit
      />
    </div>
  );
}
