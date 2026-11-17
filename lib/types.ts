/** A product as the website uses it (normalised from whatever the backend returns). */
export type Product = {
  id: string;
  name: string;            // English name
  nameFa: string;          // Farsi name
  description: string;     // English description (may be empty)
  descriptionFa: string;   // Farsi description (may be empty)
  price: number | null;    // Toman; null = no price
  images: string[];        // stored photo file names
};

/** What the website sends to create a product. `price` is left out when there is none. */
export type NewProduct = {
  name: string;
  nameFa: string;
  description: string;
  descriptionFa: string;
  price?: number;
  images: string[];
};

/** What the website sends to update a product: only the things that changed. */
export type ProductPatch = {
  name?: string;
  nameFa?: string;
  description?: string;
  descriptionFa?: string;
  price?: number;
  /** Remove the product's price. (The backend wants `price: true` for this - see updateProduct.) */
  removePrice?: boolean;
  addImages?: string[];
  removeImages?: string[];
};
