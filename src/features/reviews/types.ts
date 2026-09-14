export interface Review {
  id: string;
  productId: string;
  reviewerEmail: string;
  stars: number;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
}
