import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  UserPlus, 
  BookOpen,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllEnrollments, useUpdateEnrollment, useCancelEnrollment, type BatchEnrollment } from "@/hooks/useEnrollment";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EnrollmentWithBatch = BatchEnrollment & {
  batches?: {
    name?: string | null;
    category?: string | null;
  } | null;
};

export default function OperationsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [extendAccessOpen, setExtendAccessOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithBatch | null>(null);
  const [extendDate, setExtendDate] = useState<Date | undefined>(undefined);
  
  const { data: enrollments, isLoading: enrollmentsLoading } = useAllEnrollments();
  const updateEnrollment = useUpdateEnrollment();
  const cancelEnrollment = useCancelEnrollment();

  // Fetch student profiles
  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    totalStudents: students?.length || 0,
    activeEnrollments: enrollments?.filter(e => e.is_active).length || 0,
    pendingEnrollments: enrollments?.filter(e => e.payment_status === 'pending').length || 0,
    completedProfiles: students?.filter(s => s.profile_completed).length || 0,
  };

  const filteredEnrollments = enrollments?.filter(enrollment => {
    const matchesSearch = 
      enrollment.batches?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handler functions
  const handleViewDetails = (enrollment: EnrollmentWithBatch) => {
    setSelectedEnrollment(enrollment);
    setViewDetailsOpen(true);
  };

  const handleExtendAccess = (enrollment: EnrollmentWithBatch) => {
    setSelectedEnrollment(enrollment);
    setExtendDate(enrollment.expires_at ? new Date(enrollment.expires_at) : undefined);
    setExtendAccessOpen(true);
  };

  const handleCancelEnrollment = (enrollment: EnrollmentWithBatch) => {
    setSelectedEnrollment(enrollment);
    setCancelDialogOpen(true);
  };

  const confirmExtendAccess = async () => {
    if (!selectedEnrollment || !extendDate) return;

    // Validate that the new date is after the current expiry date
    if (selectedEnrollment.expires_at) {
      const currentExpiry = new Date(selectedEnrollment.expires_at);
      if (extendDate <= currentExpiry) {
        toast.error("New expiry date must be after the current expiry date");
        return;
      }
    }

    try {
      // Set time to end of day to include the full day in the access period
      const endOfDay = new Date(extendDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      await updateEnrollment.mutateAsync({
        id: selectedEnrollment.id,
        expires_at: endOfDay.toISOString(),
      });
      toast.success("Access extended successfully");
      setExtendAccessOpen(false);
      setSelectedEnrollment(null);
      setExtendDate(undefined);
    } catch (error) {
      toast.error("Failed to extend access");
      console.error(error);
    }
  };

  const confirmCancelEnrollment = async () => {
    if (!selectedEnrollment) return;

    try {
      await cancelEnrollment.mutateAsync(selectedEnrollment.id);
      toast.success("Enrollment cancelled successfully");
      setCancelDialogOpen(false);
      setSelectedEnrollment(null);
    } catch (error) {
      toast.error("Failed to cancel enrollment");
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Operations Dashboard</h1>
              <p className="text-muted-foreground">
                Student management and enrollments
              </p>
            </div>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Manual Enrollment
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <UserPlus className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingEnrollments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Complete Profiles</CardTitle>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedProfiles}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Verified students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="enrollments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Batch Enrollments</CardTitle>
                      <CardDescription>All student enrollments</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnrollments?.map((enrollment: EnrollmentWithBatch) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.batches?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {enrollment.is_active ? (
                              <Badge className="bg-primary/20 text-primary">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={enrollment.payment_status === 'completed' ? 'default' : 'outline'}>
                              {enrollment.payment_status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {enrollment.enrollment_type}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(enrollment)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExtendAccess(enrollment)}>
                                  Extend Access
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleCancelEnrollment(enrollment)}
                                >
                                  Cancel Enrollment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredEnrollments || filteredEnrollments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No enrollments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Student Directory</CardTitle>
                  <CardDescription>All registered students</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Target Exam</TableHead>
                        <TableHead>Profile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students?.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {student.roll_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {student.phone || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {student.target_exam || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {student.profile_completed ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Student inquiries and issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Support ticket system coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enrollment Details</DialogTitle>
              <DialogDescription>
                Complete information about this enrollment
              </DialogDescription>
            </DialogHeader>
            {selectedEnrollment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">Student ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedEnrollment.user_id}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Batch Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedEnrollment.batches?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Enrollment Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnrollment.enrolled_at ? format(new Date(selectedEnrollment.enrolled_at), 'PPP') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Expiry Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedEnrollment.expires_at ? format(new Date(selectedEnrollment.expires_at), 'PPP') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold">Payment Status</Label>
                    <Badge variant={selectedEnrollment.payment_status === 'completed' ? 'default' : 'outline'}>
                      {selectedEnrollment.payment_status || 'N/A'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-semibold">Enrollment Type</Label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedEnrollment.enrollment_type}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">Status</Label>
                    <Badge variant={selectedEnrollment.is_active ? "default" : "secondary"}>
                      {selectedEnrollment.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {selectedEnrollment.notes && (
                    <div className="col-span-2">
                      <Label className="font-semibold">Notes</Label>
                      <p className="text-sm text-muted-foreground">{selectedEnrollment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Access Dialog */}
        <Dialog open={extendAccessOpen} onOpenChange={setExtendAccessOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend Access</DialogTitle>
              <DialogDescription>
                Select a new expiry date for this enrollment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Current Expiry Date</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedEnrollment?.expires_at 
                    ? format(new Date(selectedEnrollment.expires_at), 'PPP')
                    : 'No expiry date set'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>New Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !extendDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {extendDate ? format(extendDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={extendDate}
                      onSelect={setExtendDate}
                      disabled={(date) => {
                        // Disable dates before current expiry date or today, whichever is later
                        const minDate = selectedEnrollment?.expires_at 
                          ? new Date(selectedEnrollment.expires_at)
                          : new Date();
                        return date <= minDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExtendAccessOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmExtendAccess}
                disabled={!extendDate || updateEnrollment.isPending}
              >
                {updateEnrollment.isPending ? "Extending..." : "Extend Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Enrollment Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel the enrollment for {selectedEnrollment?.batches?.name}.
                The student will lose access to this batch. This action can be reversed later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmCancelEnrollment}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelEnrollment.isPending ? "Cancelling..." : "Cancel Enrollment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
