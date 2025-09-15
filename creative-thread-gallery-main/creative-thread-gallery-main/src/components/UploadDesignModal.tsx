import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { uploadFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface UploadDesignModalProps {
  onClose: () => void;
}

export const UploadDesignModal: React.FC<UploadDesignModalProps> = ({
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    materials: "",
    care_instructions: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formDataToSend = new FormData();

      // Prepare materials as JSON array string (backend expects JSON array)
      const materialsValue = formData.materials
        ? JSON.stringify(
            formData.materials
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        : "[]";

      // Ensure care_instructions is present (backend requires it)
      const careInstructionsValue = formData.care_instructions || "";

      // Add form fields expected by backend
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("description", formData.description || "");
      formDataToSend.append("materials", materialsValue);
      formDataToSend.append("care_instructions", careInstructionsValue);
      formDataToSend.append("image_urls", "[]");

      // If there's at least one selected file, upload it first to /api/uploadimage
      let uploadedUrl = "";
      let aiDescription = "";
      if (selectedFiles.length > 0) {
        const imageForm = new FormData();
        imageForm.append("image", selectedFiles[0]);
        const uploadResp = await uploadFile("/uploadimage", imageForm);
        // uploadResp may be from our API proxy; try to read url field
        uploadedUrl = uploadResp.url || uploadResp.data?.url || "";
        aiDescription = uploadResp.ai_description || "";
      }

      // Add any returned image URL to image_urls
      if (uploadedUrl) {
        formDataToSend.append("image_urls", JSON.stringify([uploadedUrl]));
      }
      // Include AI description if available
      if (aiDescription) {
        formDataToSend.append("ai_description", aiDescription);
      }

      await uploadFile("/products/", formDataToSend);

      toast({
        title: "Design Uploaded Successfully!",
        description: "Your design has been added to your collection.",
      });

      onClose();
      // Navigate to collections so the user can see the uploaded product
      navigate("/collections");
    } catch (error) {
      toast({
        title: "Upload Failed",
        description:
          "There was an error uploading your design. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-fashion-rose/50 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-4">
          Drag & drop your design images here
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Files
          </Button>
        </div>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Files:</Label>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded"
            >
              <span className="text-sm truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Design Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Design Name</Label>
          <Input
            id="name"
            placeholder="Enter design name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            required
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, category: value }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="home">Home</SelectItem>
            <SelectItem value="art">Art</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your design, materials used, inspiration..."
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Materials */}
        <div className="space-y-2">
          <Label htmlFor="materials">Materials</Label>
          <Input
            id="materials"
            placeholder="e.g., 100% Cotton, Silk"
            value={formData.materials}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, materials: e.target.value }))
            }
          />
        </div>

        {/* Care Instructions */}
        <div className="space-y-2">
          <Label htmlFor="care">Care Instructions</Label>
          <Input
            id="care"
            placeholder="e.g., Hand wash only"
            value={formData.care_instructions}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                care_instructions: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUploading || selectedFiles.length === 0}
          className="bg-gradient-hero hover:opacity-90 transition-opacity"
        >
          {isUploading ? "Uploading..." : "Submit Design"}
        </Button>
      </div>
    </form>
  );
};
