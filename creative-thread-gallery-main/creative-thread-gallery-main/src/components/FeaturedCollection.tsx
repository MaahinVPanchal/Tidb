import React from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import { Product } from '@/types';
import patolaSareeImg from '@/assets/patola-saree.jpg';
import modernKurtaImg from '@/assets/modern-kurta.jpg';
import dupattaImg from '@/assets/dupatta.jpg';
import lehengaImg from '@/assets/lehenga.jpg';

interface FeaturedCollectionProps {
  onViewAll: () => void;
}

// Mock featured products with Patola and traditional designs
const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Traditional Patola Saree',
    price: 299.99,
    category: 'patola',
    description: 'Authentic double ikat silk saree with traditional geometric patterns from Patan, Gujarat.',
    materials: ['100% Pure Silk', 'Natural Dyes'],
    care_instructions: 'Dry clean only',
    image_urls: [patolaSareeImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Modern Fusion Kurta',
    price: 89.99,
    category: 'modern',
    description: 'Contemporary design with traditional elements, perfect for modern fashionistas.',
    materials: ['Cotton Silk Blend'],
    care_instructions: 'Hand wash cold',
    image_urls: [modernKurtaImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Handwoven Dupatta',
    price: 129.99,
    category: 'accessories',
    description: 'Intricately handwoven dupatta with gold thread work and traditional motifs.',
    materials: ['Silk', 'Gold Thread'],
    care_instructions: 'Dry clean recommended',
    image_urls: [dupattaImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Designer Lehenga Set',
    price: 459.99,
    category: 'traditional',
    description: 'Exquisite lehenga set with intricate embroidery and mirror work.',
    materials: ['Silk', 'Zardozi Work'],
    care_instructions: 'Professional cleaning only',
    image_urls: [lehengaImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const FeaturedCollection: React.FC<FeaturedCollectionProps> = ({ onViewAll }) => {
  return (
    <section className="py-16 bg-gradient-elegant">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-luxury bg-clip-text text-transparent">
            Featured Collection
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover our handpicked selection of exquisite designs, featuring authentic Patola from Patan 
            and contemporary fusion pieces that celebrate traditional craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center">
          <Button 
            onClick={onViewAll}
            variant="outline"
            size="lg"
            className="border-2 border-fashion-gold text-fashion-gold hover:bg-fashion-gold hover:text-white transition-all duration-300 px-8"
          >
            View All Collections
          </Button>
        </div>
      </div>
    </section>
  );
};