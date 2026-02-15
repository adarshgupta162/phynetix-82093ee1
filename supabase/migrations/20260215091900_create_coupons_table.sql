-- Create coupons table for discount management
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  applicable_batches UUID[] DEFAULT NULL,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  min_purchase_amount NUMERIC DEFAULT 0,
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can view active coupons (for validation)
CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- Staff can manage coupons
CREATE POLICY "Staff can manage coupons"
ON public.coupons FOR ALL
USING (public.is_staff(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample coupons for testing
INSERT INTO public.coupons (code, discount_type, discount_value, is_active, max_uses, valid_until) VALUES
('FREE100', 'percentage', 100, true, 100, '2026-12-31 23:59:59+00'),
('SAVE50', 'percentage', 50, true, 50, '2026-12-31 23:59:59+00'),
('DISCOUNT1000', 'fixed', 1000, true, 100, '2026-12-31 23:59:59+00');
