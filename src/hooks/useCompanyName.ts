import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export function useCompanyName(fallback = "") {
  const { data } = useQuery({
    queryKey: ["app-setting-company-name"],
    queryFn: async () => {
      const { data } = await db
        .from("app_settings")
        .select("value")
        .eq("key", "company_name")
        .maybeSingle();
      return data?.value || fallback;
    },
    staleTime: 300000,
  });
  return data || fallback;
}
