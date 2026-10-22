import { notFound } from "next/navigation";
import { getEvent } from "@/lib/events";
import FormBuilder from "@/components/FormBuilder";
import AdminShell from "@/components/AdminShell";

export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export default async function EditEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();
  return (
    <AdminShell width="max-w-3xl">
      <FormBuilder initial={event} />
    </AdminShell>
  );
}
