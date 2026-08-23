import { PortfolioDashboard } from "@/components/portfolio/PortfolioDashboard";

export default async function PortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PortfolioDashboard portfolioId={Number(id)} />;
}

