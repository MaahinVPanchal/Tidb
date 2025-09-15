import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";
import { Product } from "@/types";
import { apiRequest } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import featuredImage from "@/assets/featured-collection.jpg";
import patolaSareeImg from "@/assets/patola-saree.jpg";
import modernKurtaImg from "@/assets/modern-kurta.jpg";
import dupattaImg from "@/assets/dupatta.jpg";
import lehengaImg from "@/assets/lehenga.jpg";
import bandhaniScarf from "@/assets/bandhani-scarf.jpg";
import anarkaliImg from "@/assets/anarkali.jpg";

// Mock products data - in real app, this would come from API
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Traditional Patola Saree",
    price: 299.99,
    category: "patola",
    description:
      "Authentic double ikat silk saree with traditional geometric patterns from Patan, Gujarat.",
    materials: ["100% Pure Silk", "Natural Dyes"],
    care_instructions: "Dry clean only",
    image_urls: [patolaSareeImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Modern Fusion Kurta",
    price: 89.99,
    category: "modern",
    description:
      "Contemporary design with traditional elements, perfect for modern fashionistas.",
    materials: ["Cotton Silk Blend"],
    care_instructions: "Hand wash cold",
    image_urls: [modernKurtaImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Handwoven Dupatta",
    price: 129.99,
    category: "accessories",
    description:
      "Intricately handwoven dupatta with gold thread work and traditional motifs.",
    materials: ["Silk", "Gold Thread"],
    care_instructions: "Dry clean recommended",
    image_urls: [dupattaImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Designer Lehenga Set",
    price: 459.99,
    category: "traditional",
    description:
      "Exquisite lehenga set with intricate embroidery and mirror work.",
    materials: ["Silk", "Zardozi Work"],
    care_instructions: "Professional cleaning only",
    image_urls: [lehengaImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Silk Bandhani Scarf",
    price: 79.99,
    category: "accessories",
    description:
      "Traditional tie-dye technique from Rajasthan, perfect for any occasion.",
    materials: ["Pure Silk"],
    care_instructions: "Hand wash only",
    image_urls: [bandhaniScarf],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Contemporary Anarkali",
    price: 189.99,
    category: "modern",
    description:
      "Modern take on the classic Anarkali with contemporary cuts and prints.",
    materials: ["Georgette", "Silk Lining"],
    care_instructions: "Dry clean recommended",
    image_urls: [anarkaliImg],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const Collections: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  const handleNavigation = (section: string) => {
    switch (section) {
      case "home":
        navigate("/");
        break;
      case "new-arrivals":
        navigate("/new-arrivals");
        break;
      case "collections":
        // Already on collections page
        break;
      default:
        navigate("/");
    }
  };

  useEffect(() => {
    // Fetch products from API on mount
    const fetchProducts = async () => {
      try {
        const data = await apiRequest("/products/");
        if (Array.isArray(data)) {
          setAllProducts(data);
          setFilteredProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = allProducts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.materials.some((material) =>
            material.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filter by price range
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter((product) => {
        if (max) {
          return product.price >= min && product.price <= max;
        } else {
          return product.price >= min;
        }
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, priceRange, allProducts]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "patola", label: "Patola" },
    { value: "traditional", label: "Traditional" },
    { value: "modern", label: "Modern" },
    { value: "accessories", label: "Accessories" },
  ];

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-100", label: "Under $100" },
    { value: "100-200", label: "$100 - $200" },
    { value: "200-400", label: "$200 - $400" },
    { value: "400", label: "Over $400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigation} />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-elegant">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-fashion-gold text-white mb-4">
              All Collections
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Discover Our
              <span className="block bg-gradient-hero bg-clip-text text-transparent">
                Complete Collection
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore our entire range of traditional and contemporary fashion
              pieces, featuring authentic Patola from Patan and modern fusion
              designs.
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Filter by:
                </span>
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {filteredProducts.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold">
                  {filteredProducts.length} Product
                  {filteredProducts.length !== 1 ? "s" : ""} Found
                </h2>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} of {allProducts.length}{" "}
                  products
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="mb-6">
                <img
                  src={featuredImage}
                  alt="No products found"
                  className="w-32 h-32 mx-auto rounded-full object-cover opacity-50"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search terms to find what you're
                looking for.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setPriceRange("all");
                }}
                variant="outline"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Collections;
