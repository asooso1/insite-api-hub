import { getAppData } from "@/lib/data-service";
import DashboardUI from "@/components/dashboard/DashboardUI";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const cookieStore = await cookies();
  const currentProjectId = cookieStore.get("current_project_id")?.value || undefined;

  const data = await getAppData(currentProjectId);

  return (
    <DashboardUI initialData={data} selectedProjectId={currentProjectId} />
  );
}
