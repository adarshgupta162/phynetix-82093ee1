import { useState } from 'react';
import { LatexRenderer } from '@/components/ui/latex-renderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// The example LaTeX content from the problem statement
const exampleLatex = `\\textbf{Questions 15 \\& 16:}

Two point sound sources of the same frequency $f$ and amplitudes 
$2A$ and $4A$ are situated at $x = 0$ and $x = 20\\lambda$ respectively 
($\\lambda$ = wavelength) on the $x$-axis. The sources vibrate in the same phase.

Four observers $A, B, C,$ and $D$ are situated at

\\[
x_A = 4\\lambda, \\quad 
x_B = 8\\lambda, \\quad 
x_C = 12\\lambda, \\quad 
x_D = 16\\lambda.
\\]

The intensity observed by another observer $O$ situated exactly at the 
midpoint of the two sources is $I_0$.

Given:
\\[
36kA^2 = 100 I_0.
\\]

\\textbf{List--I (Observers)}

I. Observer $A$  

II. Observer $B$  

III. Observer $C$  

IV. Observer $D$  

\\textbf{List--II (Intensity values in units of $kA^2$)}

P. $\\dfrac{9}{16}$  

Q. $\\dfrac{49}{144}$  

R. $\\dfrac{4}{9}$  

S. $\\dfrac{5}{16}$  

T. $\\dfrac{81}{64}$  

U. $\\dfrac{10}{36}$  

\\textbf{Question 15:}

Match List--I with List--II for the intensity observed 
(in units of $kA^2$).

\\textbf{Options:}

A. I--Q, II--R, III--S, IV--P  

B. I--P, II--Q, III--R, IV--T  

C. I--P, II--Q, III--T, IV--S  

D. I--Q, II--P, III--R, IV--T  

\\textbf{Question 16:}

In a separate experiment, the locations of the two sources are interchanged.  
Match the new intensities observed (in units of $kA^2$).`;

const additionalExamples = [
  {
    title: "Basic Math",
    content: "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ for equation $ax^2+bx+c=0$."
  },
  {
    title: "Display Math",
    content: "Einstein's famous equation:\n\\[\nE = mc^2\n\\]\nwhere $E$ is energy, $m$ is mass, and $c$ is the speed of light."
  },
  {
    title: "Matching Columns (Array)",
    content: `\\textbf{Match the following:}

$$
\\begin{array}{|l|l|}
\\hline
\\textbf{List-I} & \\textbf{List-II} \\\\
\\hline
\\text{A. Newton's Law} & \\text{P. } E=mc^2 \\\\
\\text{B. Einstein's Equation} & \\text{Q. } F=ma \\\\
\\text{C. Ohm's Law} & \\text{R. } V=IR \\\\
\\text{D. Wave Equation} & \\text{S. } v=f\\lambda \\\\
\\hline
\\end{array}
$$`
  },
  {
    title: "Two Column Layout (HTML)",
    content: `\\textbf{Match List-I with List-II:}

\\twocolumn{
\\textbf{List-I}

A. Proton

B. Neutron  

C. Electron

D. Photon
}{
\\textbf{List-II}

P. Negative charge

Q. Positive charge

R. Neutral particle

S. No mass
}`
  },
  {
    title: "Fractions and Superscripts",
    content: "The probability formula: $P(A) = \\dfrac{n(A)}{n(S)}$ and exponential growth $y = a \\cdot e^{kx}$"
  },
  {
    title: "Greek Letters",
    content: "Common Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\delta$, $\\theta$, $\\pi$, $\\sigma$, $\\omega$, $\\Omega$"
  },
  {
    title: "Physics Equations",
    content: "Newton's second law: $F = ma$\n\nKinetic energy: $KE = \\frac{1}{2}mv^2$\n\nWave equation: $v = f\\lambda$"
  }
];

export default function LatexTestPage() {
  const [customLatex, setCustomLatex] = useState('');
  const [selectedExample, setSelectedExample] = useState(exampleLatex);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">LaTeX Renderer Test Page</h1>
          <p className="text-muted-foreground">
            Test and preview LaTeX mathematical expressions and physics problems
          </p>
        </div>

        <Tabs defaultValue="example" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="example">Problem Example</TabsTrigger>
            <TabsTrigger value="samples">Sample Formulas</TabsTrigger>
            <TabsTrigger value="custom">Custom Input</TabsTrigger>
          </TabsList>

          <TabsContent value="example" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Physics Problem with LaTeX</CardTitle>
                <CardDescription>
                  This is the example from the problem statement - demonstrating complex LaTeX rendering
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">LaTeX Source:</h3>
                  <ScrollArea className="h-64 w-full rounded-md border p-4 bg-muted/30">
                    <pre className="text-xs font-mono">{exampleLatex}</pre>
                  </ScrollArea>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-2">Rendered Output:</h3>
                  <div className="p-6 bg-card border rounded-lg">
                    <LatexRenderer content={exampleLatex} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="samples" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {additionalExamples.map((example, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{example.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Source:</p>
                      <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                        {example.content}
                      </code>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rendered:</p>
                      <div className="p-3 bg-card border rounded">
                        <LatexRenderer content={example.content} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom LaTeX Input</CardTitle>
                <CardDescription>
                  Enter your own LaTeX code to test the renderer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter LaTeX code:
                  </label>
                  <Textarea
                    value={customLatex}
                    onChange={(e) => setCustomLatex(e.target.value)}
                    placeholder="Enter LaTeX code here, e.g., $E = mc^2$ or $$\int_0^1 x^2 dx$$"
                    className="min-h-32 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Use $...$ for inline math, $$...$$ or \[...\] for display math
                  </p>
                </div>

                {customLatex && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Rendered Output:
                    </label>
                    <div className="p-6 bg-card border rounded-lg">
                      <LatexRenderer content={customLatex} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => setCustomLatex('$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$')}
                  >
                    Load Quadratic Formula
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCustomLatex('$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$')}
                  >
                    Load Gaussian Integral
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCustomLatex(`\\textbf{Match the following:}

\\twocolumn{
\\textbf{List-I}

A. Newton's Law

B. Einstein's Equation

C. Ohm's Law
}{
\\textbf{List-II}

P. $E=mc^2$

Q. $F=ma$

R. $V=IR$
}`)}
                  >
                    Load Matching Columns
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCustomLatex('')}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Usage Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How to use LatexRenderer in your components:</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { LatexRenderer } from '@/components/ui/latex-renderer';

// In your component:
<LatexRenderer content="Your LaTeX content with $math$ here" />

// With custom styling:
<LatexRenderer 
  content="Your LaTeX content" 
  className="text-lg"
  displayMode={false}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Supported LaTeX features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Inline math: <code>$...$</code> or <code>\(...\)</code></li>
                <li>Display math: <code>$$...$$</code> or <code>\[...\]</code></li>
                <li>Fractions: <code>\frac{"{a}"}{"{b}"}</code> or <code>\dfrac{"{a}"}{"{b}"}</code></li>
                <li>Greek letters: <code>\alpha</code>, <code>\beta</code>, <code>\theta</code>, etc.</li>
                <li>Superscripts and subscripts: <code>x^2</code>, <code>x_i</code></li>
                <li>Square roots: <code>\sqrt{"{x}"}</code></li>
                <li>Integrals and sums: <code>\int</code>, <code>\sum</code></li>
                <li>Text formatting: <code>\textbf{"{bold}"}</code>, <code>\textit{"{italic}"}</code>, <code>\underline{"{text}"}</code></li>
                <li>Line breaks: <code>\\</code>, <code>\newline</code>, <code>\bigskip</code></li>
                <li>And many more standard LaTeX commands...</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">Creating Matching Columns:</h3>
              <p className="text-sm mb-3 text-green-900 dark:text-green-100">
                For matching questions (List-I with List-II), you have two options:
              </p>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold mb-1 text-green-800 dark:text-green-200">1. Using KaTeX Array (Recommended for Math):</p>
                  <pre className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs overflow-x-auto">
{`$$
\\begin{array}{|l|l|}
\\hline
\\textbf{List-I} & \\textbf{List-II} \\\\
\\hline
\\text{A. Item 1} & \\text{P. Match 1} \\\\
\\text{B. Item 2} & \\text{Q. Match 2} \\\\
\\hline
\\end{array}
$$`}
                  </pre>
                  <p className="text-xs mt-1 text-green-700 dark:text-green-300">
                    • Use <code>\text{"{}"}</code> for text inside math mode<br/>
                    • <code>\hline</code> for horizontal lines<br/>
                    • <code>&</code> separates columns, <code>\\</code> creates new rows<br/>
                    • <code>|l|l|</code> means 2 left-aligned columns with borders
                  </p>
                </div>

                <div>
                  <p className="font-semibold mb-1 text-green-800 dark:text-green-200">2. Using Two-Column Layout (For Plain Text):</p>
                  <pre className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs overflow-x-auto">
{`\\twocolumn{
\\textbf{List-I}

A. Item 1
B. Item 2
}{
\\textbf{List-II}

P. Match 1
Q. Match 2
}`}
                  </pre>
                  <p className="text-xs mt-1 text-green-700 dark:text-green-300">
                    • Simple side-by-side layout<br/>
                    • First {"{"} {"}"} contains left column<br/>
                    • Second {"{"} {"}"} contains right column<br/>
                    • Can include math expressions with $ or $$
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm">
                <strong>Note:</strong> The renderer uses KaTeX for fast rendering with MathJax as a fallback 
                for more complex expressions. Most standard LaTeX math commands are supported.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
