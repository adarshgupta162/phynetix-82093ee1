import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBatch } from "@/hooks/useBatches";
import { useCreateEnrollment } from "@/hooks/useEnrollment";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IndianRupee, ArrowLeft, Shield, Tag, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: batch, isLoading } = useBatch(batchId);
  const createEnrollment = useCreateEnrollment();
  
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");

  // For now, we'll implement a simple "demo" checkout that creates a manual enrollment
  // Real payment integration would connect to Razorpay/Stripe here
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    
    try {
      // Query the coupons table to validate the coupon
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Coupon validation error:', error);
        toast.error("Failed to validate coupon");
        setIsApplyingCoupon(false);
        return;
      }

      if (!coupon) {
        toast.error("Invalid coupon code");
        setIsApplyingCoupon(false);
        return;
      }

      // Check if coupon is still valid (not expired)
      if (coupon.valid_until) {
        const expiryDate = new Date(coupon.valid_until);
        if (expiryDate < new Date()) {
          toast.error("This coupon has expired");
          setIsApplyingCoupon(false);
          return;
        }
      }

      // Check if coupon has reached max uses
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        toast.error("This coupon has reached its usage limit");
        setIsApplyingCoupon(false);
        return;
      }

      // Check if batch price meets minimum purchase amount
      if (coupon.min_purchase_amount && batch && batch.price < coupon.min_purchase_amount) {
        toast.error(`Minimum purchase amount of ₹${coupon.min_purchase_amount} required`);
        setIsApplyingCoupon(false);
        return;
      }

      // Check if coupon is applicable to this batch
      if (coupon.applicable_batches && coupon.applicable_batches.length > 0) {
        if (!batchId || !coupon.applicable_batches.includes(batchId)) {
          toast.error("This coupon is not applicable to this batch");
          setIsApplyingCoupon(false);
          return;
        }
      }

      // Calculate discount
      let discount = 0;
      if (batch) {
        if (coupon.discount_type === 'percentage') {
          discount = (batch.price * coupon.discount_value) / 100;
        } else if (coupon.discount_type === 'fixed') {
          discount = coupon.discount_value;
        }
        
        // Ensure discount doesn't exceed the batch price
        discount = Math.min(discount, batch.price);
      }

      // Apply the discount
      setAppliedDiscount(discount);
      setAppliedCouponCode(coupon.code);
      
      const finalAmount = batch ? batch.price - discount : 0;
      if (finalAmount === 0) {
        toast.success(`Coupon applied! Price reduced to ₹0. You can now enroll for free.`);
      } else {
        toast.success(`Coupon applied! Discount of ₹${discount.toLocaleString('en-IN')} applied.`);
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      toast.error(error.message || "Failed to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!user || !batchId) {
      toast.error("Please login to continue");
      return;
    }

    // CRITICAL: Only allow enrollment if final price is ₹0
    // This prevents users from bypassing payment
    if (finalPrice > 0) {
      toast.error("Please apply a valid coupon code to reduce the price to ₹0 for free enrollment");
      return;
    }

    // TODO: Future payment integration
    // When payment gateway (Razorpay/Stripe) is integrated, this is where the payment flow will be initiated:
    // 1. If finalPrice > 0, redirect to payment gateway
    // 2. On successful payment callback, create enrollment with payment details
    // 3. Update coupon usage count
    // For now, we only allow free enrollments (finalPrice === 0)

    // For demo purposes, create a manual enrollment when price is ₹0
    try {
      await createEnrollment.mutateAsync({
        batchId,
        enrollmentType: 'manual', // Change to 'paid' when payment integration is ready
        notes: appliedCouponCode 
          ? `Free enrollment with coupon: ${appliedCouponCode}` 
          : 'Demo enrollment - payment integration pending',
      });
      
      toast.success("Enrollment successful!");
      navigate('/my-batches');
    } catch (error: any) {
      toast.error(error.message || "Failed to complete enrollment");
    }
  };

  const finalPrice = batch ? batch.price - appliedDiscount : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!batch) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Batch Not Found</h1>
          <Button onClick={() => navigate('/batches')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/batches/${batchId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batch Details
          </Button>

          <h1 className="text-3xl font-bold mb-8">Complete Your Enrollment</h1>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your enrollment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{batch.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {batch.short_description}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch Price</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {(batch.original_price || batch.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  {batch.original_price && batch.original_price > batch.price && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span className="flex items-center">
                        - <IndianRupee className="w-4 h-4" />
                        {(batch.original_price - batch.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Coupon Discount</span>
                      <span className="flex items-center">
                        - <IndianRupee className="w-4 h-4" />
                        {appliedDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="flex items-center">
                    <IndianRupee className="w-5 h-5" />
                    {finalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Complete your purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                <div className="space-y-2">
                  <Label htmlFor="coupon">Have a coupon?</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="coupon"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="pl-9"
                        disabled={appliedDiscount > 0}
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim() || appliedDiscount > 0}
                    >
                      {isApplyingCoupon ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                  {appliedCouponCode && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="w-4 h-4" />
                      <span>Coupon "{appliedCouponCode}" applied successfully</span>
                    </div>
                  )}
                </div>

                {/* Alert for price > 0 */}
                {finalPrice > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please apply a valid coupon code to reduce the price to ₹0 for free enrollment. Payment gateway integration is coming soon.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success message for price = 0 */}
                {finalPrice === 0 && batch.price > 0 && (
                  <Alert className="border-primary/50 bg-primary/10">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      Great! You can now enroll for free with your coupon code.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                {/* Payment Info */}
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Secure payment powered by Razorpay</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Instant access after payment</span>
                  </div>
                </div>

                <Badge variant="outline" className="w-full justify-center py-2">
                  Payment integration coming soon - use coupon codes for now
                </Badge>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={createEnrollment.isPending || finalPrice > 0}
                >
                  {createEnrollment.isPending 
                    ? "Processing..." 
                    : finalPrice > 0 
                      ? `Apply Coupon to Enroll (₹${finalPrice.toLocaleString('en-IN')})` 
                      : `Enroll Now - Free`}
                </Button>
                {finalPrice > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Button will be enabled once price is ₹0
                  </p>
                )}
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
