import { useState, useEffect } from "react";
import { 
  Settings, Clock, FileText, Eye, EyeOff, Save, 
  Copy, Trash2, Archive, RotateCcw, AlertTriangle,
  Camera, Mic, Monitor, ShieldCheck, UserPlus, X, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface AllowlistUser {
  id: string;
  user_id: string;
  user_name: string;
}

interface Test {
  id: string;
  name: string;
  description: string | null;
  exam_type: string;
  duration_minutes: number;
  is_published: boolean;
  fullscreen_enabled: boolean;
  show_solutions: boolean;
  instructions_json: any;
  proctoring_enabled?: boolean;
  proctoring_require_camera?: boolean;
  proctoring_require_mic?: boolean;
  proctoring_require_screen?: boolean;
  proctoring_snapshot_interval?: number;
  proctoring_allowlist_only?: boolean;
}

interface TestSettingsPanelProps {
  test: Test;
  onUpdate: (updates: Partial<Test>) => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
  onTogglePublish: () => Promise<void>;
  totalQuestions: number;
  isSaving: boolean;
}

export function TestSettingsPanel({
  test,
  onUpdate,
  onDuplicate,
  onDelete,
  onTogglePublish,
  totalQuestions,
  isSaving
}: TestSettingsPanelProps) {
  const [localTest, setLocalTest] = useState(test);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Proctoring allowlist state
  const [allowlist, setAllowlist] = useState<AllowlistUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: string; full_name: string | null }[]>([]);
  const [loadingAllowlist, setLoadingAllowlist] = useState(false);

  // Load allowlist when panel opens
  useEffect(() => {
    if (!localTest.proctoring_enabled) return;
    loadAllowlist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localTest.proctoring_enabled]);

  const loadAllowlist = async () => {
    const { data } = await supabase
      .from("proctoring_allowlist")
      .select("id, user_id")
      .eq("test_id", test.id);
    if (!data?.length) { setAllowlist([]); return; }
    const userIds = data.map((r) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);
    const profileMap: Record<string, string> = {};
    profiles?.forEach((p) => { profileMap[p.id] = p.full_name ?? "Unknown"; });
    setAllowlist(
      data.map((r) => ({ id: r.id, user_id: r.user_id, user_name: profileMap[r.user_id] ?? "Unknown" }))
    );
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setUserResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", `%${q}%`)
      .limit(10);
    setUserResults(data ?? []);
  };

  const addToAllowlist = async (userId: string) => {
    setLoadingAllowlist(true);
    await supabase.from("proctoring_allowlist").upsert(
      { test_id: test.id, user_id: userId },
      { onConflict: "test_id,user_id" }
    );
    await loadAllowlist();
    setUserSearch("");
    setUserResults([]);
    setLoadingAllowlist(false);
  };

  const removeFromAllowlist = async (rowId: string) => {
    await supabase.from("proctoring_allowlist").delete().eq("id", rowId);
    setAllowlist((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleChange = (field: keyof Test, value: any) => {
    setLocalTest({ ...localTest, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onUpdate({
      name: localTest.name,
      description: localTest.description,
      duration_minutes: localTest.duration_minutes,
      fullscreen_enabled: localTest.fullscreen_enabled,
      show_solutions: localTest.show_solutions,
      proctoring_enabled: localTest.proctoring_enabled,
      proctoring_require_camera: localTest.proctoring_require_camera,
      proctoring_require_mic: localTest.proctoring_require_mic,
      proctoring_require_screen: localTest.proctoring_require_screen,
      proctoring_snapshot_interval: localTest.proctoring_snapshot_interval,
      proctoring_allowlist_only: localTest.proctoring_allowlist_only,
    });
    setHasChanges(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Test Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6 pb-10">
          {/* Test Name */}
          <div className="space-y-2">
            <Label>Test Name</Label>
            <Input
              value={localTest.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter test name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={localTest.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add test description..."
              className="min-h-[100px]"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duration (minutes)
            </Label>
            <Input
              type="number"
              value={localTest.duration_minutes}
              onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 60)}
              min={1}
              max={600}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Fullscreen Mode</Label>
                <p className="text-xs text-muted-foreground">Require fullscreen during test</p>
              </div>
              <Switch
                checked={localTest.fullscreen_enabled}
                onCheckedChange={(checked) => handleChange('fullscreen_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Show Solutions</Label>
                <p className="text-xs text-muted-foreground">Show solutions after test completion</p>
              </div>
              <Switch
                checked={localTest.show_solutions}
                onCheckedChange={(checked) => handleChange('show_solutions', checked)}
              />
            </div>
          </div>

          {/* ── Proctoring Settings ── */}
          <div className="space-y-4 border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Live Proctoring
                </Label>
                <p className="text-xs text-muted-foreground">Enable real-time monitoring for this test</p>
              </div>
              <Switch
                checked={!!localTest.proctoring_enabled}
                onCheckedChange={(checked) => handleChange('proctoring_enabled', checked)}
              />
            </div>

            {localTest.proctoring_enabled && (
              <>
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Required Devices
                  </Label>

                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 font-normal">
                      <Camera className="w-4 h-4" />Camera
                    </Label>
                    <Switch
                      checked={!!localTest.proctoring_require_camera}
                      onCheckedChange={(c) => handleChange('proctoring_require_camera', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 font-normal">
                      <Mic className="w-4 h-4" />Microphone
                    </Label>
                    <Switch
                      checked={!!localTest.proctoring_require_mic}
                      onCheckedChange={(c) => handleChange('proctoring_require_mic', c)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 font-normal">
                      <Monitor className="w-4 h-4" />Screen Share
                    </Label>
                    <Switch
                      checked={!!localTest.proctoring_require_screen}
                      onCheckedChange={(c) => handleChange('proctoring_require_screen', c)}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Snapshot Interval (seconds)
                  </Label>
                  <Input
                    type="number"
                    min={10}
                    max={300}
                    value={localTest.proctoring_snapshot_interval ?? 30}
                    onChange={(e) => handleChange('proctoring_snapshot_interval', parseInt(e.target.value) || 30)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <Label className="font-normal">Allowlist Only</Label>
                    <p className="text-xs text-muted-foreground">Only specific users are monitored</p>
                  </div>
                  <Switch
                    checked={!!localTest.proctoring_allowlist_only}
                    onCheckedChange={(c) => handleChange('proctoring_allowlist_only', c)}
                  />
                </div>

                {/* Allowlist management */}
                {localTest.proctoring_allowlist_only && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      User Allowlist
                    </Label>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search student by name..."
                        className="pl-8 text-sm"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          searchUsers(e.target.value);
                        }}
                      />
                    </div>
                    {userResults.length > 0 && (
                      <div className="border border-border rounded-lg divide-y divide-border max-h-40 overflow-y-auto">
                        {userResults.map((u) => (
                          <button
                            key={u.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                            onClick={() => addToAllowlist(u.id)}
                            disabled={loadingAllowlist}
                          >
                            <span>{u.full_name ?? u.id}</span>
                            <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Current allowlist */}
                    {allowlist.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allowlist.map((u) => (
                          <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
                            {u.user_name}
                            <button onClick={() => removeFromAllowlist(u.id)} className="hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No users added yet — all authenticated users can be monitored when allowlist is empty.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Test Info */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Questions</span>
              <span className="font-medium">{totalQuestions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Exam Type</span>
              <span className="font-medium">{localTest.exam_type === 'jee_advanced' ? 'JEE Advanced' : 'JEE Mains'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${test.is_published ? 'text-green-600' : 'text-yellow-600'}`}>
                {test.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              onClick={onTogglePublish}
              className="w-full"
            >
              {test.is_published ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Unpublish Test
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Publish Test
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onDuplicate}
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Test
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Test
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Delete Test?
              </DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              This will permanently delete "{test.name}" and all its questions. This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
              }}>
                Delete Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
