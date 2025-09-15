import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FavoritesState {
  favorites: Product[];
  favoriteIds: Set<string>;
}

type FavoritesAction = 
  | { type: 'ADD_TO_FAVORITES'; product: Product }
  | { type: 'REMOVE_FROM_FAVORITES'; productId: string }
  | { type: 'LOAD_FAVORITES'; favorites: Product[] };

interface FavoritesContextType {
  state: FavoritesState;
  dispatch: React.Dispatch<FavoritesAction>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (product: Product) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case 'ADD_TO_FAVORITES':
      if (state.favoriteIds.has(action.product.id)) {
        return state;
      }
      const newFavorites = [...state.favorites, action.product];
      const newFavoriteIds = new Set(state.favoriteIds);
      newFavoriteIds.add(action.product.id);
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      
      return {
        favorites: newFavorites,
        favoriteIds: newFavoriteIds,
      };

    case 'REMOVE_FROM_FAVORITES':
      const filteredFavorites = state.favorites.filter(product => product.id !== action.productId);
      const updatedFavoriteIds = new Set(state.favoriteIds);
      updatedFavoriteIds.delete(action.productId);
      
      localStorage.setItem('favorites', JSON.stringify(filteredFavorites));
      
      return {
        favorites: filteredFavorites,
        favoriteIds: updatedFavoriteIds,
      };

    case 'LOAD_FAVORITES':
      return {
        favorites: action.favorites,
        favoriteIds: new Set(action.favorites.map(product => product.id)),
      };

    default:
      return state;
  }
};

const initialState: FavoritesState = {
  favorites: [],
  favoriteIds: new Set<string>(),
};

export const FavoritesProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(favoritesReducer, initialState);
  
  const { toast } = useToast();

  useEffect(() => {
    // Load favorites from localStorage on mount
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites) as Product[];
        dispatch({ type: 'LOAD_FAVORITES', favorites });
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, []);

  const isFavorite = (productId: string): boolean => {
    return state.favoriteIds.has(productId);
  };

  const toggleFavorite = (product: Product) => {
    const isCurrentlyFavorite = isFavorite(product.id);
    
    if (isCurrentlyFavorite) {
      dispatch({ type: 'REMOVE_FROM_FAVORITES', productId: product.id });
      toast({
        title: "Removed from Favorites",
        description: `${product.name} has been removed from your favorites.`,
      });
    } else {
      dispatch({ type: 'ADD_TO_FAVORITES', product });
      toast({
        title: "Added to Favorites",
        description: `${product.name} has been added to your favorites.`,
      });
    }
  };

  return (
    <FavoritesContext.Provider value={{ state, dispatch, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};