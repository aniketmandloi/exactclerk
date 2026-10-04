import DealView from "./deal-view";

export const metadata = { title: "Deal" };

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealView id={id} />;
}
