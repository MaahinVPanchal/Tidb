import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-patola.jpg';

interface HeroSectionProps {
  onExploreCollection: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreCollection }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage}
          alt="Elegant Patola Fashion"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center lg:text-left">
        <div className="max-w-3xl">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <Sparkles className="h-6 w-6 text-fashion-gold mr-2" />
            <span className="text-fashion-gold font-medium tracking-wider uppercase text-sm">
              Premium Fashion Collection
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Elegant Designs
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Crafted for You
            </span>
          </h1>

          <p className="text-xl text-white/90 mb-12 max-w-2xl leading-relaxed">
            Discover the beauty of traditional Patola from Patan, Gujarat, and contemporary fashion pieces. 
            Upload your own designs and let our artisans bring your vision to life with premium materials 
            and exquisite craftsmanship.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
            <Button 
              onClick={onExploreCollection}
              size="lg"
              className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-luxury text-white px-8 py-4 text-lg"
            >
              Explore Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};