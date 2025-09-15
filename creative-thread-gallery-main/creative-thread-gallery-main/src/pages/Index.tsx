import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeaturedCollection } from '@/components/FeaturedCollection';
import { AboutSection } from '@/components/AboutSection';
import { DesignShowcase } from '@/components/DesignShowcase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UploadDesignModal } from '@/components/UploadDesignModal';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [currentSection, setCurrentSection] = useState('home');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (section: string) => {
    switch (section) {
      case 'collections':
        navigate('/collections');
        break;
      case 'new-arrivals':
        navigate('/new-arrivals');
        break;
      case 'about':
        setCurrentSection('about');
        // Scroll to about section
        setTimeout(() => {
          const aboutElement = document.getElementById('about-section');
          if (aboutElement) {
            aboutElement.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
        break;
      default:
        setCurrentSection(section);
        if (section === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
  };

  const handleExploreCollection = () => {
    navigate('/new-arrivals');
  };

  const handleViewAllCollections = () => {
    navigate('/collections');
  };

  const handleUploadDesign = () => {
    setIsUploadOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigation} />
      
      <main>
        <HeroSection onExploreCollection={handleExploreCollection} />
        
        <FeaturedCollection onViewAll={handleViewAllCollections} />
        
        <DesignShowcase onUploadDesign={handleUploadDesign} />
        
        <div id="about-section">
          <AboutSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-fashion-charcoal text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                Atelier
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                Where traditional craftsmanship meets modern design. Creating beautiful, 
                sustainable fashion with authentic materials and skilled artisans.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Collections</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="/new-arrivals" className="hover:text-fashion-gold transition-colors">New Arrivals</a></li>
                <li><a href="/collections" className="hover:text-fashion-gold transition-colors">All Collections</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Patola Sarees</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Custom Designs</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Size Guide</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Care Instructions</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Returns</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-fashion-gold transition-colors">Pinterest</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/60">
            <p>&copy; 2024 Atelier. All rights reserved. Made with ❤️ for fashion enthusiasts.</p>
          </div>
        </div>
      </footer>

      {/* Upload Design Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Your Design</DialogTitle>
          </DialogHeader>
          <UploadDesignModal onClose={() => setIsUploadOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
