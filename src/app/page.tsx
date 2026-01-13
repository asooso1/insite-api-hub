import { getAppData } from "@/lib/data-service";
import { DashboardUI } from "@/components/dashboard/DashboardUI";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "./actions/auth";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect('/auth');
  }

  const cookieStore = await cookies();
  const currentProjectId = cookieStore.get("current_project_id")?.value || undefined;

  const data = await getAppData(currentProjectId);
  const effectiveProjectId = currentProjectId || (data.projects.length > 0 ? data.projects[0].id : null);

  return (
    <DashboardUI initialData={data} currentProjectId={effectiveProjectId} />
  );
}
