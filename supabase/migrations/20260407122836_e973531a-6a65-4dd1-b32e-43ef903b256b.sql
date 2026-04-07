-- Create product_images table
CREATE TABLE public.product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own product images"
ON public.product_images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own product images"
ON public.product_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own product images"
ON public.product_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products p WHERE p.id = product_images.product_id AND p.user_id = auth.uid()
  )
);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their images
CREATE POLICY "Users can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');