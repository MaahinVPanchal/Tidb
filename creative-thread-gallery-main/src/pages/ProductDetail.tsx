import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Share2 } from 'lucide-react';
import { Product } from '@/types';

// Mock product data - in real app, this would come from API
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Traditional Patola Saree",
    price: 299.99,
    category: "patola",
    description: "Authentic double ikat silk saree with traditional geometric patterns from Patan, Gujarat. This exquisite piece showcases the centuries-old weaving tradition passed down through generations of master artisans.",
    materials: ["100% Pure Silk", "Natural Dyes", "Gold Zari"],
    care_instructions: "Dry clean only, store in silk pouch",
    image_urls: ["/src/assets/patola-saree.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Modern Fusion Kurta",
    price: 89.99,
    category: "modern",
    description: "Contemporary design with traditional elements, perfect for modern fashionistas. This kurta combines the elegance of traditional Indian wear with contemporary styling.",
    materials: ["Cotton Silk Blend", "Hand Block Print"],
    care_instructions: "Hand wash cold, air dry",
    image_urls: ["/src/assets/modern-kurta.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Handwoven Dupatta",
    price: 129.99,
    category: "accessories",
    description: "Intricately handwoven dupatta with gold thread work and traditional motifs. Perfect for special occasions and formal events.",
    materials: ["Silk", "Gold Thread", "Zardozi Work"],
    care_instructions: "Dry clean recommended",
    image_urls: ["/src/assets/dupatta.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Designer Lehenga Set",
    price: 459.99,
    category: "traditional",
    description: "Exquisite lehenga set with intricate embroidery and mirror work. A perfect choice for weddings and special celebrations.",
    materials: ["Silk", "Zardozi Work", "Mirror Work"],
    care_instructions: "Professional cleaning only",
    image_urls: ["/src/assets/lehenga.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Silk Bandhani Scarf",
    price: 79.99,
    category: "accessories",
    description: "Beautiful silk scarf with traditional bandhani tie-dye patterns. A versatile accessory that adds elegance to any outfit.",
    materials: ["Pure Silk", "Natural Dyes"],
    care_instructions: "Dry clean or gentle hand wash",
    image_urls: ["/src/assets/bandhani-scarf.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Elegant Anarkali Suit",
    price: 199.99,
    category: "traditional",
    description: "Stunning anarkali suit with intricate embroidery and flowing silhouette. Perfect for festive occasions and celebrations.",
    materials: ["Silk", "Embroidery", "Stone Work"],
    care_instructions: "Dry clean only",
    image_urls: ["/src/assets/anarkali.jpg"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = mockProducts.find(p => p.id === id);

  const handleNavigation = (section: string) => {
    switch (section) {
      case 'home':
        navigate('/');
        break;
      case 'collections':
        navigate('/collections');
        break;
      case 'new-arrivals':
        navigate('/new-arrivals');
        break;
      case 'about':
        navigate('/#about-section');
        break;
      default:
        navigate('/');
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header onNavigate={handleNavigation} />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigation} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/collections')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Collections
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-elegant rounded-xl overflow-hidden">
              {product.image_urls.length > 0 ? (
                <img 
                  src={product.image_urls[0]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No Image</span>
                </div>
              )}
            </div>
            
            {/* Additional Images */}
            {product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image_urls.slice(1, 5).map((image, index) => (
                  <div key={index} className="aspect-square bg-gradient-elegant rounded-lg overflow-hidden">
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <Badge className="bg-fashion-gold text-white mb-4">
                {product.category}
              </Badge>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-3xl font-bold text-fashion-rose mb-6">${product.price}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Materials</h3>
              <div className="flex flex-wrap gap-2">
                {product.materials.map((material, index) => (
                  <Badge key={index} variant="outline">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Care Instructions</h3>
              <p className="text-muted-foreground">{product.care_instructions}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button 
                size="lg"
                className="flex-1 bg-gradient-hero hover:opacity-90 transition-opacity"
              >
                Add to Cart Soon Arrived..
              </Button>
              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5 mr-2" />
                Favorite
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
