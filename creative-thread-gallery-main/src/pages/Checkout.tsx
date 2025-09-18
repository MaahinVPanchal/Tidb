import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Phone, Mail, CreditCard, Truck } from 'lucide-react';
import { Address, Order } from '@/types';
import { toast } from 'sonner';

// Razorpay configuration
const RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag'; // Replace with your actual Razorpay key

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { state: cartState, dispatch: cartDispatch } = useCart();
  const { state: authState } = useAuth();
  
  const [address, setAddress] = useState<Address>({
    fullName: '',
    phone: '',
    email: authState.user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingCost] = useState(50); // Fixed shipping cost
  const [taxRate] = useState(0.18); // 18% GST

  const subtotal = cartState.total;
  const taxAmount = subtotal * taxRate;
  const finalAmount = subtotal + shippingCost + taxAmount;

  useEffect(() => {
    if (cartState.items.length === 0) {
      navigate('/');
      toast.error('Your cart is empty');
    }
  }, [cartState.items.length, navigate]);

  const handleInputChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof Address)[] = [
      'fullName', 'phone', 'email', 'addressLine1', 'city', 'state', 'pincode'
    ];
    
    for (const field of requiredFields) {
      if (!address[field]?.trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(address.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Phone validation (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(address.phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    // Pincode validation
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(address.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }

    return true;
  };

  const createRazorpayOrder = async (): Promise<string> => {
    // In a real application, this would be a call to your backend
    // For now, we'll simulate creating an order
    const orderData = {
      amount: Math.round(finalAmount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    };

    // Simulate API call - replace with actual backend call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`order_${Date.now()}`);
      }, 1000);
    });
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);
    
    try {
      // Create Razorpay order
      const razorpayOrderId = await createRazorpayOrder();
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: Math.round(finalAmount * 100),
          currency: 'INR',
          name: 'Creative Thread Gallery',
          description: `Order for ${cartState.items.length} items`,
          order_id: razorpayOrderId,
          prefill: {
            name: address.fullName,
            email: address.email,
            contact: address.phone,
          },
          notes: {
            address: `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`,
          },
          theme: {
            color: '#D4AF37', // Fashion gold color
          },
          handler: async (response: any) => {
            // Handle successful payment
            await handlePaymentSuccess(response, razorpayOrderId);
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response: any, razorpayOrderId: string) => {
    try {
      // Create order object
      const order: Order = {
        id: `order_${Date.now()}`,
        userId: authState.user?.id || 'guest',
        items: cartState.items,
        shippingAddress: address,
        totalAmount: subtotal,
        shippingCost,
        taxAmount,
        finalAmount,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: response.razorpay_payment_id,
        razorpayOrderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In a real application, save order to backend
      console.log('Order created:', order);
      
      // Clear cart
      cartDispatch({ type: 'CLEAR_CART' });
      
      // Show success message
      toast.success('Payment successful! Your order has been placed.');
      
      // Navigate to order confirmation page
      navigate('/order-confirmation');
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Order creation failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartState.items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-fashion-gold hover:text-fashion-rose"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-fashion-gold to-fashion-rose bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Complete your order and get your beautiful designs delivered in 5 days
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Address Form */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <Card className="border-2 border-fashion-gold/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-fashion-gold/10 to-fashion-rose/10">
                <CardTitle className="flex items-center text-fashion-gold">
                  <MapPin className="w-5 h-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={address.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      className="border-fashion-gold/30 focus:border-fashion-gold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={address.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter 10-digit phone number"
                      className="border-fashion-gold/30 focus:border-fashion-gold"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={address.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className="border-fashion-gold/30 focus:border-fashion-gold"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Textarea
                    id="addressLine1"
                    value={address.addressLine1}
                    onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                    placeholder="House/Flat No., Street, Area"
                    className="border-fashion-gold/30 focus:border-fashion-gold"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Textarea
                    id="addressLine2"
                    value={address.addressLine2}
                    onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                    placeholder="Landmark, Building Name (Optional)"
                    className="border-fashion-gold/30 focus:border-fashion-gold"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className="border-fashion-gold/30 focus:border-fashion-gold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      className="border-fashion-gold/30 focus:border-fashion-gold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={address.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      placeholder="6-digit pincode"
                      className="border-fashion-gold/30 focus:border-fashion-gold"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            {/* Order Items */}
            <Card className="border-2 border-fashion-gold/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-fashion-gold/10 to-fashion-rose/10">
                <CardTitle className="text-fashion-gold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {item.product.image_urls.length > 0 ? (
                            <img 
                              src={item.product.image_urls[0]} 
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground text-xs">No Image</div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.product.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-fashion-gold">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Truck className="w-4 h-4 mr-1" />
                      Shipping
                    </span>
                    <span>₹{shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (GST 18%)</span>
                    <span>₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-fashion-rose">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-gradient-to-r from-fashion-gold to-fashion-rose hover:opacity-90 text-white font-semibold py-3 text-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay ₹{finalAmount.toFixed(2)} with Razorpay
                    </div>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Secure payment powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
