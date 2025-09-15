import React from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Star, TrendingUp } from 'lucide-react';
import { Product } from '@/types';
import { useNavigate } from 'react-router-dom';
import heroImage from '@/assets/hero-patola.jpg';
import royalPatolaImg from '@/assets/royal-patola.jpg';
import patolaDupattaSetImg from '@/assets/patola-dupatta-set.jpg';
import modernKurtaImg from '@/assets/modern-kurta.jpg';
import dupattaImg from '@/assets/dupatta.jpg';
import patolaSareeImg from '@/assets/patola-saree.jpg';
import lehengaImg from '@/assets/lehenga.jpg';

// Mock new arrivals with focus on Patola from Patan
const newArrivals: Product[] = [
  {
    id: 'na1',
    name: 'Royal Patola Saree - Patan Heritage',
    price: 599.99,
    category: 'patola',
    description: 'Exquisite double ikat Patola saree handwoven by master artisans from Patan, Gujarat. Features traditional elephant and parrot motifs in rich silk.',
    materials: ['100% Pure Silk', 'Natural Dyes', 'Gold Zari'],
    care_instructions: 'Dry clean only, store in silk pouch',
    image_urls: [royalPatolaImg],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 'na2',
    name: 'Patan Patola Dupatta Set',
    price: 299.99,
    category: 'patola',
    description: 'Authentic Patola dupatta with matching blouse piece. Traditional geometric patterns in vibrant colors.',
    materials: ['Silk', 'Traditional Dyes'],
    care_instructions: 'Hand wash with mild silk detergent',
    image_urls: [patolaDupattaSetImg],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 'na3',
    name: 'Contemporary Patola Fusion Dress',
    price: 189.99,
    category: 'modern',
    description: 'Modern A-line dress featuring authentic Patola patterns in a contemporary silhouette.',
    materials: ['Silk Blend', 'Patola Motifs'],
    care_instructions: 'Dry clean recommended',
    image_urls: [modernKurtaImg],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 'na4',
    name: 'Patola Silk Stole',
    price: 149.99,
    category: 'accessories',
    description: 'Lightweight silk stole with traditional Patola border designs. Perfect for formal occasions.',
    materials: ['Pure Silk', 'Traditional Weave'],
    care_instructions: 'Dry clean or gentle hand wash',
    image_urls: [dupattaImg],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 'na5',
    name: 'Heritage Patola Kurta Set',
    price: 259.99,
    category: 'traditional',
    description: 'Traditional kurta with Patola-inspired prints and matching palazzo pants.',
    materials: ['Cotton Silk', 'Block Prints'],
    care_instructions: 'Machine wash cold, air dry',
    image_urls: [patolaSareeImg],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 'na6',
    name: 'Patola Wedding Collection',
    price: 899.99,
    category: 'traditional',
    description: 'Luxury bridal Patola saree with heavy gold zari work and traditional wedding motifs.',
    materials: ['Pure Silk', 'Gold Zari', 'Real Gold Threads'],
    care_instructions: 'Professional cleaning only',
    image_urls: [lehengaImg],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
  },
];

const NewArrivals: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (section: string) => {
    switch (section) {
      case 'home':
        navigate('/');
        break;
      case 'collections':
        navigate('/collections');
        break;
      case 'new-arrivals':
        // Already on new arrivals page
        break;
      default:
        navigate('/');
    }
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigation} />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage}
            alt="New Arrivals"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-fashion-gold mr-2" />
              <Badge className="bg-fashion-gold text-white">Fresh Arrivals</Badge>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              New Arrivals
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Patola of Patan
              </span>
            </h1>

            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              Discover the latest additions to our collection, featuring authentic Patola sarees 
              and contemporary designs inspired by the traditional weaving heritage of Patan, Gujarat. 
              Each piece represents centuries of craftsmanship and artistic excellence.
            </p>

            <div className="flex items-center space-x-6 text-white/80">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>Updated Weekly</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span>Premium Quality</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured New Arrival */}
      <section className="py-16 bg-gradient-elegant">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-fashion-rose text-white mb-4">Featured This Week</Badge>
            <h2 className="text-3xl font-bold mb-4">Spotlight: Royal Patola Collection</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our master weavers from Patan have created this exceptional piece using traditional 
              double ikat techniques passed down through generations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-luxury p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="aspect-square bg-gradient-elegant rounded-xl flex items-center justify-center mb-4">
                    <span className="text-muted-foreground">Featured Product Image</span>
                  </div>
                </div>
                <div>
                  <Badge className="bg-fashion-gold text-white mb-4">Just Arrived</Badge>
                  <h3 className="text-2xl font-bold mb-4">{newArrivals[0].name}</h3>
                  <p className="text-muted-foreground mb-6">{newArrivals[0].description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {newArrivals[0].materials.map((material, index) => (
                      <Badge key={index} variant="outline">{material}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-bold text-fashion-rose">${newArrivals[0].price}</span>
                    <span className="text-sm text-muted-foreground">
                      Added {getDaysAgo(newArrivals[0].created_at)} days ago
                    </span>
                  </div>
                  
                  <Button className="w-full bg-gradient-hero hover:opacity-90 transition-opacity">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All New Arrivals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-4">Latest Additions</h2>
              <p className="text-muted-foreground">
                {newArrivals.length} new products added this month
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/collections')}
              className="border-fashion-gold text-fashion-gold hover:bg-fashion-gold hover:text-white transition-all duration-300"
            >
              View All Collections
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newArrivals.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <Badge className="absolute top-4 left-4 bg-fashion-rose text-white">
                  New
                </Badge>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-2 py-1">
                  <span className="text-xs text-muted-foreground">
                    {getDaysAgo(product.created_at)} days ago
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Patola Section */}
      <section className="py-16 bg-gradient-elegant">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">The Art of Patola</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Patola is a double ikat woven sari, usually made from silk, made in Patan, Gujarat. 
              The word patola is the plural of patolu, which is a Gujarati word. These saris are 
              known for their geometric patterns and vibrant colors. The process of making a 
              single Patola sari can take anywhere from six months to a year, making each piece 
              a true work of art.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-fashion-rose mb-2">700+</div>
                <div className="text-muted-foreground">Years of Tradition</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-fashion-gold mb-2">6-12</div>
                <div className="text-muted-foreground">Months per Saree</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-fashion-rose mb-2">5</div>
                <div className="text-muted-foreground">Families Still Weaving</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NewArrivals;