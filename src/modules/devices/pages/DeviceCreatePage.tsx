import { useNavigate } from "react-router-dom";
import { DeviceForm } from "../components/DeviceForm";
import { useCreateDevice } from "../hooks/useDevices";

export default function DeviceCreatePage() {
  const navigate = useNavigate();
  const createDevice = useCreateDevice();

  const handleSubmit = async (data: any) => {
    const device = await createDevice.mutateAsync(data);
    navigate(`/devices/${device.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Dispositivo</h1>
        <p className="text-muted-foreground">Cadastro de equipamento para atendimento</p>
      </div>
      <DeviceForm onSubmit={handleSubmit} isSubmitting={createDevice.isPending} />
    </div>
  );
}
