import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const { dispatch } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  
  const isLiked = isFavorite(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'ADD_TO_CART', product });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product);
  };

  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-0 shadow-elegant hover:shadow-luxury transition-all duration-300 hover:scale-105"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        <div className="aspect-square bg-gradient-elegant">
          {product.image_urls.length > 0 ? (
            <img 
              src={product.image_urls[0]} 
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
        </div>
        
        {/* Overlay actions */}
        <div className="absolute top-4 right-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full shadow-lg ${isLiked ? 'text-fashion-rose bg-white' : 'bg-white/90 hover:bg-white'}`}
            onClick={handleLike}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>

        {/* Category Badge */}
        {product.category && (
          <Badge className="absolute top-4 left-4 bg-fashion-gold text-white">
            {product.category}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
        
        {product.materials.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.materials.slice(0, 2).map((material, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {material}
              </Badge>
            ))}
            {product.materials.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{product.materials.length - 2} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-fashion-rose">${product.price}</span>
          {product.care_instructions && (
            <span className="text-xs text-muted-foreground">{product.care_instructions}</span>
          )}
        </div>
        
        <Button 
          onClick={handleAddToCart}
          className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-gold"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};