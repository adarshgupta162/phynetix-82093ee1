import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertTriangle, Trash2, Loader2,
} from "lucide-react";

const EXPECTED_COLUMNS = [
  "subject", "chapter", "topic", "question_text",
  "option_1", "option_2", "option_3", "option_4",
  "correct_answer", "question_type", "marks", "negative_marks",
  "difficulty", "time_seconds", "solution_text",
];

const REQUIRED_COLUMNS = ["subject", "question_text", "correct_answer", "question_type"];

interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
}

const VALID_TYPES = ["single_correct", "multiple_correct", "integer"];
const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

function validateRow(row: Record<string, string>, idx: number): ParsedRow {
  const errors: string[] = [];
  for (const col of REQUIRED_COLUMNS) {
    if (!row[col]?.toString().trim()) errors.push(`Missing ${col}`);
  }
  const qType = row.question_type?.toString().trim().toLowerCase();
  if (qType && !VALID_TYPES.includes(qType)) errors.push(`Invalid question_type: ${qType}`);
  const diff = row.difficulty?.toString().trim().toLowerCase();
  if (diff && !VALID_DIFFICULTIES.includes(diff)) errors.push(`Invalid difficulty: ${diff}`);
  if (row.marks && isNaN(Number(row.marks))) errors.push("marks must be a number");
  if (row.negative_marks && isNaN(Number(row.negative_marks))) errors.push("negative_marks must be a number");
  return { rowIndex: idx, data: row, errors, valid: errors.length === 0 };
}

function mapRowToQuestion(row: Record<string, string>, userId: string) {
  const qType = row.question_type?.trim().toLowerCase() || "single_correct";
  const typeMap: Record<string, string> = {
    single_correct: "single_choice",
    multiple_correct: "multiple_choice",
    integer: "integer",
  };

  const options = [1, 2, 3, 4]
    .map((i) => row[`option_${i}`]?.trim())
    .filter(Boolean)
    .map((text, i) => ({ label: `(${i + 1})`, text }));

  let correctAnswer: any;
  const ca = row.correct_answer?.trim();
  if (qType === "integer") {
    correctAnswer = ca;
  } else if (qType === "multiple_correct" && ca?.includes(",")) {
    correctAnswer = ca.split(",").map((v: string) => Number(v.trim()) - 1);
  } else {
    correctAnswer = Number(ca) - 1;
  }

  return {
    subject: row.subject?.trim() || "Physics",
    chapter: row.chapter?.trim() || null,
    topic: row.topic?.trim() || null,
    question_text: row.question_text?.trim() || null,
    question_type: typeMap[qType] || "single_choice",
    options: options.length > 0 ? options : null,
    correct_answer: correctAnswer,
    marks: Number(row.marks) || 4,
    negative_marks: Number(row.negative_marks) || 1,
    difficulty: row.difficulty?.trim().toLowerCase() || "medium",
    time_seconds: Number(row.time_seconds) || 60,
    solution_text: row.solution_text?.trim() || null,
    created_by: userId,
  };
}

function generateSampleCSV(): string {
  const header = EXPECTED_COLUMNS.join(",");
  const row1 = [
    "Physics", "Mechanics", "Kinematics",
    "A ball is thrown vertically upward with velocity 20 m/s. Find max height.",
    "20m", "10m", "15m", "5m",
    "1", "single_correct", "4", "1", "medium", "60",
    "Using v²=u²-2gh, h=u²/2g=20m",
  ].join(",");
  const row2 = [
    "Chemistry", "Atomic Structure", "Quantum Numbers",
    "Which quantum numbers are valid for 3d orbital?",
    "n=3 l=2", "n=3 l=0", "n=2 l=2", "n=3 l=3",
    "1,2", "multiple_correct", "4", "2", "hard", "90",
    "For 3d: n=3 and l=2",
  ].join(",");
  return `${header}\n${row1}\n${row2}`;
}

export default function BulkQuestionImport() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback((file: File) => {
    setResult(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const parsed = (res.data as Record<string, string>[]).map((r, i) => validateRow(r, i + 1));
          setRows(parsed);
          toast.success(`Parsed ${parsed.length} rows from CSV`);
        },
        error: () => toast.error("Failed to parse CSV"),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        const parsed = data.map((r, i) => validateRow(r, i + 1));
        setRows(parsed);
        toast.success(`Parsed ${parsed.length} rows from Excel`);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error("Unsupported file format. Use .csv or .xlsx");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleDownloadTemplate = () => {
    const blob = new Blob([generateSampleCSV()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!user) return toast.error("You must be logged in");
    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) return toast.error("No valid rows to import");

    setImporting(true);
    let success = 0;
    let failed = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE).map((r) => mapRowToQuestion(r.data, user.id));
      const { error } = await supabase.from("phynetix_library").insert(batch as any);
      if (error) {
        failed += batch.length;
        console.error("Batch insert error:", error);
      } else {
        success += batch.length;
      }
    }

    const invalidCount = rows.length - validRows.length;
    setResult({ success, failed: failed + invalidCount });
    setImporting(false);
    if (success > 0) toast.success(`${success} questions imported successfully`);
    if (failed + invalidCount > 0) toast.error(`${failed + invalidCount} rows failed/skipped`);
  };

  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Bulk Question Import</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Upload CSV or Excel files to import questions into the library
          </p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </div>

      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) parseFile(e.target.files[0]); }}
        />
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-foreground font-medium">Drag & drop your file here or click to browse</p>
        <p className="text-muted-foreground text-sm mt-1">Supports .csv and .xlsx files</p>
      </Card>

      {/* Summary */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <FileSpreadsheet className="h-3 w-3" /> {rows.length} rows
          </Badge>
          <Badge className="gap-1 bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3" /> {validCount} valid
          </Badge>
          {invalidCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> {invalidCount} invalid
            </Badge>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setRows([]); setResult(null); }}>
              Clear All
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="gap-2"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import {validCount} Questions
            </Button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className="p-4 flex items-center gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-medium text-foreground">Import Complete</p>
            <p className="text-sm text-muted-foreground">
              {result.success} imported successfully, {result.failed} failed/skipped
            </p>
          </div>
        </Card>
      )}

      {/* Preview Table */}
      {rows.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead className="min-w-[200px]">Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Answer</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead className="w-16">Errors</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={row.valid ? "" : "bg-destructive/5"}
                  >
                    <TableCell className="text-muted-foreground">{row.rowIndex}</TableCell>
                    <TableCell>
                      {row.valid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{row.data.subject}</TableCell>
                    <TableCell>{row.data.chapter}</TableCell>
                    <TableCell className="max-w-[250px] truncate">{row.data.question_text}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {row.data.question_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.data.correct_answer}</TableCell>
                    <TableCell>{row.data.marks || "4"}</TableCell>
                    <TableCell>{row.data.difficulty || "medium"}</TableCell>
                    <TableCell>
                      {row.errors.length > 0 && (
                        <span className="text-xs text-destructive" title={row.errors.join(", ")}>
                          {row.errors.length} error{row.errors.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
