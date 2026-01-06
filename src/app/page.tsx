import { getAppData } from "@/lib/data-service";
import DashboardUI from "@/components/dashboard/DashboardUI";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getAppData();

  return (
    <DashboardUI initialData={data} />
  );
}
