import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Scissors, Package } from 'lucide-react';
import designShowcaseImage from '@/assets/design-showcase.jpg';

interface DesignShowcaseProps {
  onUploadDesign: () => void;
}

export const DesignShowcase: React.FC<DesignShowcaseProps> = ({ onUploadDesign }) => {
  const processSteps = [
    {
      icon: <Upload className="h-6 w-6 text-white" />,
      title: "Upload Design",
      description: "Share your creative vision with detailed specifications"
    },
    {
      icon: <Palette className="h-6 w-6 text-white" />,
      title: "Design Review",
      description: "Our experts review and optimize your design"
    },
    {
      icon: <Scissors className="h-6 w-6 text-white" />,
      title: "Crafting",
      description: "Master artisans bring your design to life"
    },
    {
      icon: <Package className="h-6 w-6 text-white" />,
      title: "Delivery",
      description: "Receive your custom-made fashion piece"
    }
  ];

  return (
    <section className="py-20 bg-gradient-elegant">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <Badge className="bg-fashion-rose text-white mb-6">Custom Design Service</Badge>
            <h2 className="text-4xl font-bold mb-6">
              Showcase Your 
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Creative Vision
              </span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Transform your fashion ideas into reality with our custom design service. Whether you have 
              sketches, inspiration images, or detailed specifications, our team of skilled artisans will 
              work with you to create unique, high-quality garments that reflect your personal style.
            </p>

            {/* Process Steps */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {processSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                    <p className="text-muted-foreground text-xs">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onUploadDesign}
                className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-gold"
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Your Design
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <Card className="overflow-hidden border-0 shadow-luxury">
              <CardContent className="p-0">
                <div className="aspect-square">
                  <img 
                    src={designShowcaseImage}
                    alt="Fashion Design Workspace"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Floating Stats */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur rounded-lg p-4 shadow-elegant">
              <div className="text-center">
                <div className="text-2xl font-bold text-fashion-rose mb-1">2-3 weeks</div>
                <div className="text-xs text-muted-foreground">Average delivery</div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur rounded-lg p-4 shadow-elegant">
              <div className="text-center">
                <div className="text-2xl font-bold text-fashion-gold mb-1">$50+</div>
                <div className="text-xs text-muted-foreground">Starting price</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};