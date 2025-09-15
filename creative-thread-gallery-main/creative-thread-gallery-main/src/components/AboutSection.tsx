import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Heart, Palette, Users } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const features = [
    {
      icon: <Palette className="h-8 w-8 text-fashion-rose" />,
      title: "Custom Designs",
      description: "Upload your unique designs and watch our skilled artisans bring them to life with premium materials."
    },
    {
      icon: <Award className="h-8 w-8 text-fashion-gold" />,
      title: "Premium Quality",
      description: "We use only the finest silk, cotton, and traditional materials sourced from authentic suppliers."
    },
    {
      icon: <Users className="h-8 w-8 text-fashion-rose" />,
      title: "Master Craftsmen",
      description: "Our team includes skilled artisans from Patan, Gujarat, specializing in traditional Patola weaving."
    },
    {
      icon: <Heart className="h-8 w-8 text-fashion-gold" />,
      title: "Sustainable Fashion",
      description: "Committed to ethical production and supporting traditional craftsmanship communities."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-fashion-gold text-white mb-4">About Atelier</Badge>
          <h2 className="text-4xl font-bold mb-6">
            Where Tradition Meets 
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Modern Innovation
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            Founded with a passion for preserving traditional Indian textile arts while embracing contemporary design, 
            Atelier bridges the gap between heritage craftsmanship and modern fashion sensibilities. We specialize in 
            authentic Patola from Patan, Gujarat, and offer a platform for fashion enthusiasts to create their own 
            unique designs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-elegant hover:shadow-luxury transition-all duration-300">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-elegant mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-gradient-elegant rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-6">Our Heritage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <h4 className="text-xl font-semibold mb-3 text-fashion-rose">Patola Legacy</h4>
              <p className="text-muted-foreground">
                The ancient art of Patola weaving from Patan, Gujarat, represents one of India's most sophisticated 
                textile traditions. Our master weavers continue this 700-year-old legacy with authentic techniques.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-3 text-fashion-gold">Artisan Community</h4>
              <p className="text-muted-foreground">
                We work directly with artisan families, ensuring fair wages and preserving traditional skills. 
                Every purchase supports these talented craftspeople and their communities.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-3 text-fashion-rose">Innovation</h4>
              <p className="text-muted-foreground">
                While honoring tradition, we embrace innovation. Our design platform allows customers to create 
                personalized pieces that blend classical techniques with contemporary aesthetics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};