export interface Review {
  id: string;
  productId: string;
  reviewerName: string;
  stars: number;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}
