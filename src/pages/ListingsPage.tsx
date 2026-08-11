import { useSearchParams } from "react-router-dom";
import ListingsMenu from "@/components/listings/ListingsMenu";
import Listings from "./Listings";
import IncomingListings from "./IncomingListings";

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  if (view === "incoming") return <IncomingListings />;
  if (view === "vandute") return <Listings initialSegment="vandute" />;
  if (view === "stoc") return <Listings initialSegment="instoc" />;
  return <ListingsMenu />;
}
