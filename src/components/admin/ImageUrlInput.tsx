 import { useState } from "react";
 import { Link2, X, Image as ImageIcon, Check } from "lucide-react";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import {
   Popover,
   PopoverContent,
   PopoverTrigger,
 } from "@/components/ui/popover";
 import { cn } from "@/lib/utils";
 
 interface ImageUrlInputProps {
   value: string | null | undefined;
   onChange: (url: string | null) => void;
   compact?: boolean;
   label?: string;
 }
 
 export function ImageUrlInput({ value, onChange, compact = false, label = "Image" }: ImageUrlInputProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [inputUrl, setInputUrl] = useState(value || "");
   const [previewError, setPreviewError] = useState(false);
 
   const handleConfirm = () => {
     const trimmed = inputUrl.trim();
     if (trimmed && isValidImageUrl(trimmed)) {
       onChange(trimmed);
       setIsOpen(false);
     } else if (!trimmed) {
       onChange(null);
       setIsOpen(false);
     }
   };
 
   const handleClear = () => {
     setInputUrl("");
     onChange(null);
     setIsOpen(false);
   };
 
   const isValidImageUrl = (url: string) => {
     try {
       new URL(url);
       return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url) || 
              url.includes('imgur') ||
              url.includes('cloudinary') ||
              url.includes('storage') ||
              url.includes('blob') ||
              url.startsWith('https://');
     } catch {
       return false;
     }
   };
 
   if (compact) {
     return (
       <div className="flex items-center gap-2 mt-1">
         {value ? (
           <div className="flex items-center gap-2">
             <img 
               src={value} 
               alt="" 
               className="h-8 w-8 rounded object-cover border"
               onError={() => setPreviewError(true)}
             />
             <Button 
               type="button" 
               variant="ghost" 
               size="sm" 
               onClick={() => onChange(null)}
               className="h-6 w-6 p-0 text-destructive"
             >
               <X className="w-3 h-3" />
             </Button>
           </div>
         ) : (
           <Popover open={isOpen} onOpenChange={setIsOpen}>
             <PopoverTrigger asChild>
               <Button variant="outline" size="sm" type="button" className="h-7 text-xs">
                 <Link2 className="w-3 h-3 mr-1" />
                 Add Image URL
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-80" align="start">
               <div className="space-y-3">
                 <div className="text-sm font-medium">{label} URL</div>
                 <Input
                   value={inputUrl}
                   onChange={(e) => {
                     setInputUrl(e.target.value);
                     setPreviewError(false);
                   }}
                   placeholder="https://example.com/image.png"
                   className="text-sm"
                 />
                 {inputUrl && isValidImageUrl(inputUrl) && !previewError && (
                   <div className="border rounded p-2">
                     <img 
                       src={inputUrl} 
                       alt="Preview" 
                       className="max-h-24 mx-auto rounded"
                       onError={() => setPreviewError(true)}
                     />
                   </div>
                 )}
                 {previewError && (
                   <p className="text-xs text-destructive">Failed to load image preview</p>
                 )}
                 <div className="flex gap-2">
                   <Button size="sm" onClick={handleConfirm} className="flex-1">
                     <Check className="w-3 h-3 mr-1" /> Add
                   </Button>
                   <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                     Cancel
                   </Button>
                 </div>
               </div>
             </PopoverContent>
           </Popover>
         )}
       </div>
     );
   }
 
   return (
     <div className="space-y-2">
       <div className="flex items-center gap-2">
         <Input
           value={value || ""}
           onChange={(e) => onChange(e.target.value || null)}
           placeholder="Paste image URL..."
           className="flex-1"
         />
         {value && (
           <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
             <X className="w-4 h-4" />
           </Button>
         )}
       </div>
       {value && (
         <div className="border rounded p-2 bg-secondary/30">
           <img 
             src={value} 
             alt="Preview" 
             className="max-h-32 mx-auto rounded"
             onError={(e) => {
               (e.target as HTMLImageElement).style.display = 'none';
             }}
           />
         </div>
       )}
     </div>
   );
 }