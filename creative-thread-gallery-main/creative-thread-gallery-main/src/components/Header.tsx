import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, ShoppingBag, Upload, Menu, MessageCircle, User } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { UploadDesignModal } from './UploadDesignModal';
import { AuthModal } from './AuthModal';
import { CartSheet } from './CartSheet';
import { ChatBot } from './ChatBot';

interface HeaderProps {
  onNavigate: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { state: cartState } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleExploreCollection = () => {
    onNavigate('new-arrivals');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 
              className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => onNavigate('home')}
            >
              Atelier
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-fashion-rose transition-colors"
              onClick={() => onNavigate('collections')}
            >
              Collections
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-fashion-rose transition-colors"
              onClick={() => onNavigate('new-arrivals')}
            >
              New Arrivals
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-fashion-rose transition-colors"
              onClick={() => onNavigate('about')}
            >
              About
            </Button>
            <Button 
              variant="outline" 
              className="border-fashion-gold text-fashion-gold hover:bg-fashion-gold hover:text-white transition-all duration-300"
              onClick={handleExploreCollection}
            >
              Explore Collection
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {/* Upload Design */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:text-fashion-rose transition-colors"
                >
                  <Upload className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Your Design</DialogTitle>
                </DialogHeader>
                <UploadDesignModal onClose={() => setIsUploadOpen(false)} />
              </DialogContent>
            </Dialog>

            {/* Chat */}
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:text-fashion-rose transition-colors"
              onClick={() => setIsChatOpen(true)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>

            {/* Favorites */}
            <Button 
              variant="ghost" 
              size="icon"
              className="hover:text-fashion-rose transition-colors"
            >
              <Heart className="h-5 w-5" />
            </Button>

            {/* Shopping Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:text-fashion-rose transition-colors">
                  <ShoppingBag className="h-5 w-5" />
                  {cartState.items.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-fashion-rose text-white text-xs">
                      {cartState.items.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <CartSheet />
              </SheetContent>
            </Sheet>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden md:block">
                  Welcome, {user?.username}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={logout}
                  className="hover:text-fashion-rose transition-colors"
                >
                  <User className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="hover:text-fashion-rose transition-colors"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <AuthModal onClose={() => setIsAuthOpen(false)} />
                </DialogContent>
              </Dialog>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => onNavigate('collections')}
                  >
                    Collections
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => onNavigate('new-arrivals')}
                  >
                    New Arrivals
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => onNavigate('about')}
                  >
                    About
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start border-fashion-gold text-fashion-gold"
                    onClick={handleExploreCollection}
                  >
                    Explore Collection
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Chat Bot */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </header>
  );
};