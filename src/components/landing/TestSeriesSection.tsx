import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle, 
  ArrowRight, 
  Trophy,
  Calendar,
  Users,
  BookOpen
} from "lucide-react";

// Category configuration with styling
const examCategories = [
  {
    id: "jee_main",
    name: "JEE Main",
    logo: "/logos/test-series/jee-main.png",
    bgGradient: "from-blue-600/20 to-blue-800/20",
    borderColor: "hover:border-blue-500/50",
  },
  {
    id: "jee_advanced",
    name: "JEE Advanced",
    logo: "/logos/test-series/jee-advanced.png",
    bgGradient: "from-purple-600/20 to-purple-800/20",
    borderColor: "hover:border-purple-500/50",
  },
  {
    id: "jee_main_advanced",
    name: "JEE Main + Advanced",
    logo: "/logos/test-series/jee-advanced.png",
    bgGradient: "from-indigo-600/20 to-indigo-800/20",
    borderColor: "hover:border-indigo-500/50",
  },
  {
    id: "neet",
    name: "NEET",
    logo: "/logos/test-series/neet.png",
    bgGradient: "from-red-600/20 to-red-800/20",
    borderColor: "hover:border-red-500/50",
  },
  {
    id: "bitsat",
    name: "BITSAT",
    logo: "/logos/test-series/bitsat.png",
    bgGradient: "from-orange-600/20 to-orange-800/20",
    borderColor: "hover:border-orange-500/50",
  },
  {
    id: "mht_cet",
    name: "MHT-CET",
    logo: "/logos/test-series/mht-cet.png",
    bgGradient: "from-green-600/20 to-green-800/20",
    borderColor: "hover:border-green-500/50",
  },
];

interface BatchWithCategory {
  id: string;
  name: string;
  short_description: string | null;
  category: string | null;
  price: number;
  original_price: number | null;
  features: string[] | null;
  current_students: number | null;
  is_featured: boolean | null;
  start_date: string | null;
}

export function TestSeriesSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch active batches
  const { data: batches, isLoading } = useQuery({
    queryKey: ["landing-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("id, name, short_description, category, price, original_price, features, current_students, is_featured, start_date")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BatchWithCategory[];
    },
  });

  // Group batches by category
  const batchesByCategory = batches?.reduce((acc, batch) => {
    const cat = batch.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(batch);
    return acc;
  }, {} as Record<string, BatchWithCategory[]>);

  // Get categories that have batches
  const activeCategories = examCategories.filter(
    cat => batchesByCategory?.[cat.id]?.length
  );

  // Show either selected category batches or featured ones
  const displayedBatches = selectedCategory
    ? batchesByCategory?.[selectedCategory] || []
    : batches?.filter(b => b.is_featured).slice(0, 6) || batches?.slice(0, 6) || [];

  const getYearFromBatch = (batch: BatchWithCategory) => {
    // Extract year from name if present, otherwise use start_date
    const yearMatch = batch.name.match(/20\d{2}/);
    if (yearMatch) return yearMatch[0];
    if (batch.start_date) {
      return new Date(batch.start_date).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  if (isLoading) {
    return (
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no batches, show placeholder
  if (!batches?.length) {
    return (
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 px-4 py-1.5 text-sm">
                <Trophy className="w-3 h-3 mr-2" />
                Test Series
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold font-display mb-4 gradient-text">
                Choose Your Test Series
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive test series designed by experts to help you ace your exams
              </p>
            </motion.div>
          </div>

          {/* Static placeholder cards when no batches exist */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examCategories.slice(0, 6).map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm ${cat.borderColor} transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <img 
                        src={cat.logo} 
                        alt={cat.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-2xl">📚</div>';
                        }}
                      />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold mb-4 group-hover:gradient-text transition-all">
                    {cat.name} Test Series
                  </h3>

                  <p className="text-sm text-muted-foreground mb-6">
                    Comprehensive test series with detailed analysis and expert solutions.
                  </p>

                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      Get Notified
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4 px-4 py-1.5 text-sm">
              <Trophy className="w-3 h-3 mr-2" />
              Test Series
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display mb-4 gradient-text">
              Choose Your Test Series
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive test series designed by experts to help you ace your exams
            </p>
          </motion.div>
        </div>

        {/* Category Filter Tabs */}
        {activeCategories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {activeCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        )}

        {/* Batch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBatches.map((batch, index) => {
            const categoryConfig = examCategories.find(c => c.id === batch.category) || examCategories[0];
            const features = (batch.features as string[]) || [];
            const year = getYearFromBatch(batch);
            const discountPercent = batch.original_price 
              ? Math.round(((batch.original_price - batch.price) / batch.original_price) * 100)
              : 0;

            return (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm ${categoryConfig.borderColor} transition-all duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${categoryConfig.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                      <img 
                        src={categoryConfig.logo} 
                        alt={batch.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="text-2xl">📚</div>';
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {year}
                      </Badge>
                      {batch.is_featured && (
                        <Badge className="text-xs bg-primary/20 text-primary">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                    {batch.name}
                  </h3>

                  {batch.short_description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {batch.short_description}
                    </p>
                  )}

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {batch.current_students !== null && batch.current_students > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {batch.current_students}+ students
                      </span>
                    )}
                    {batch.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Starts {new Date(batch.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold">₹{batch.price.toLocaleString('en-IN')}</span>
                      {discountPercent > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          ₹{batch.original_price?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {discountPercent > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {discountPercent}% OFF
                      </Badge>
                    )}
                  </div>

                  <Link to={`/batches/${batch.id}`}>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        {batches && batches.length > 6 && (
          <div className="text-center mt-8">
            <Link to="/batches">
              <Button variant="outline" size="lg">
                View All Test Series
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
