import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { List, Eye, ImageIcon } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  images?: { url: string }[];
  _count: {
    views: number;
  };
}

interface ListingAnalyticsWidgetProps {
  title: string;
  listings: Listing[];
}

const ListingAnalyticsWidget = ({
  title,
  listings,
}: ListingAnalyticsWidgetProps) => {
  return (
    <Card className="border-card-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <List className="w-10 h-10 mb-4 opacity-50" />
            <p>Nu sunt date de afișat.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {listings.map((listing) => (
              <li key={listing.id}>
                <Link
                  to={`/listings/${listing.id}/edit`}
                  className="flex items-center gap-4 p-2 -m-2 rounded-lg transition-colors hover:bg-secondary"
                >
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {listing.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{listing._count.views} vizualizări</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingAnalyticsWidget;
