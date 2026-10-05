import { notFound, redirect } from "next/navigation";
import { getOwnedRoute } from "@/features/route/queries";
import { tripIdSchema } from "@/features/trips/schemas";

// The trip cover is the first destination's image: send the user straight to that upload.
export default async function TripCoverPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!tripIdSchema.safeParse(tripId).success) notFound();
  const route = await getOwnedRoute(tripId);
  if (!route) notFound();
  const first = [...route.stops].sort((a, b) => a.position - b.position)[0];
  redirect(first ? `/trips/${tripId}/destinations/${first.id}/edit?cover=1#imagem` : `/trips/${tripId}/destinations/new`);
}
