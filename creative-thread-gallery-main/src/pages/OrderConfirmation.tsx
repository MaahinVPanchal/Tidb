import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Home, Package } from 'lucide-react';

const OrderConfirmation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-fashion-gold/20 shadow-xl">
        <CardHeader className="text-center bg-gradient-to-r from-fashion-gold/10 to-fashion-rose/10">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl font-bold text-fashion-gold">
            Order Confirmed!
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
        </CardHeader>
        
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-fashion-rose">
              <Package className="w-5 h-5" />
              <span className="font-semibold">Order ID: #{Date.now().toString().slice(-8)}</span>
            </div>
            
            <p className="text-muted-foreground">
              You will receive an email confirmation shortly with your order details and tracking information.
            </p>
            
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-fashion-gold mb-2">What's Next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• We'll process your order within 1-2 business days</li>
                <li>• You'll receive tracking information via email</li>
                <li>• Your beautiful designs will be delivered in 5 days</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-fashion-gold to-fashion-rose hover:opacity-90 text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/collections')}
              className="border-fashion-gold text-fashion-gold hover:bg-fashion-gold hover:text-white"
            >
              <Package className="w-4 h-4 mr-2" />
              View Collections
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderConfirmation;
