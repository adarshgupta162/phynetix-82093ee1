# LaTeX Rendering Guide

This guide explains how to use the LaTeX renderer in the PhyNetix project to display mathematical expressions, physics problems, and matching column layouts.

## Overview

The project includes a powerful LaTeX renderer that supports:
- Mathematical expressions (inline and display mode)
- Text formatting commands
- Column layouts for matching questions
- Chemistry expressions and advanced math (via MathJax fallback)

## Quick Start

### Basic Usage

```tsx
import { LatexRenderer } from '@/components/ui/latex-renderer';

// In your component
<LatexRenderer content="The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$" />
```

## Supported LaTeX Features

### 1. Math Expressions

#### Inline Math
Use `$...$` or `\(...\)` for inline math:

```latex
The equation $E = mc^2$ is Einstein's famous formula.
```

#### Display Math
Use `$$...$$` or `\[...\]` for centered display math:

```latex
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

### 2. Text Formatting

```latex
\textbf{Bold text}
\textit{Italic text}
\underline{Underlined text}
\texttt{Monospace text}
```

### 3. Line Breaks and Spacing

```latex
Line 1 \\ Line 2           % Line break
\newline                    % Another line break
\bigskip                    % Large vertical space
\medskip                    % Medium vertical space
\smallskip                  % Small vertical space
\quad                       % Horizontal space (4 spaces)
\qquad                      % Larger horizontal space (8 spaces)
```

### 4. Common Math Symbols

```latex
Greek letters: $\alpha$, $\beta$, $\gamma$, $\delta$, $\theta$, $\pi$, $\omega$, $\Omega$

Fractions: $\frac{a}{b}$ or $\dfrac{a}{b}$

Superscripts/Subscripts: $x^2$, $x_i$, $x_i^2$

Square roots: $\sqrt{x}$, $\sqrt[n]{x}$

Integrals: $\int$, $\int_{a}^{b}$, $\oint$

Sums: $\sum$, $\sum_{i=1}^{n}$, $\prod$
```

## Creating Matching Columns (for JEE/NEET Questions)

For matching questions where you need to display List-I and List-II side by side, you have two options:

### Method 1: Using KaTeX Array (Recommended for Math-Heavy Content)

This method creates a proper table with borders and is best when your content includes mathematical expressions.

```latex
\textbf{Match the following:}

$$
\begin{array}{|l|l|}
\hline
\textbf{List-I} & \textbf{List-II} \\
\hline
\text{A. Newton's Law} & \text{P. } F=ma \\
\text{B. Einstein's Equation} & \text{Q. } E=mc^2 \\
\text{C. Ohm's Law} & \text{R. } V=IR \\
\text{D. Wave Equation} & \text{S. } v=f\lambda \\
\hline
\end{array}
$$
```

**Key Points:**
- Use `\text{...}` for plain text inside math mode
- `\hline` creates horizontal lines
- `&` separates columns
- `\\` creates new rows
- `|l|l|` means 2 left-aligned columns with borders
- You can use `|c|c|` for center-aligned or `|r|r|` for right-aligned

**Column Alignment Options:**
- `l` = left-aligned
- `c` = center-aligned
- `r` = right-aligned
- `|` = vertical border

### Method 2: Using \twocolumn{}{} (Recommended for Plain Text)

This method creates a simple side-by-side layout without borders, ideal for text-heavy content.

```latex
\textbf{Match List-I with List-II:}

\twocolumn{
\textbf{List-I}

A. Proton

B. Neutron  

C. Electron

D. Photon
}{
\textbf{List-II}

P. Negative charge

Q. Positive charge

R. Neutral particle

S. No mass
}
```

**Key Points:**
- First `{...}` contains left column content
- Second `{...}` contains right column content
- Can include math expressions with `$...$` or `$$...$$`
- Automatically creates a grid layout with a divider between columns

## Complete Example: Physics Problem

Here's a complete example showing the LaTeX from the problem statement:

```latex
\textbf{Questions 15 \& 16:}

Two point sound sources of the same frequency $f$ and amplitudes 
$2A$ and $4A$ are situated at $x = 0$ and $x = 20\lambda$ respectively 
($\lambda$ = wavelength) on the $x$-axis. The sources vibrate in the same phase.

Four observers $A, B, C,$ and $D$ are situated at

\[
x_A = 4\lambda, \quad 
x_B = 8\lambda, \quad 
x_C = 12\lambda, \quad 
x_D = 16\lambda.
\]

The intensity observed by another observer $O$ situated exactly at the 
midpoint of the two sources is $I_0$.

Given:
\[
36kA^2 = 100 I_0.
\]

\textbf{List--I (Observers)}

I. Observer $A$  
II. Observer $B$  
III. Observer $C$  
IV. Observer $D$  

\textbf{List--II (Intensity values in units of $kA^2$)}

P. $\dfrac{9}{16}$  
Q. $\dfrac{49}{144}$  
R. $\dfrac{4}{9}$  
S. $\dfrac{5}{16}$  
T. $\dfrac{81}{64}$  

\textbf{Question 15:}

Match List--I with List--II for the intensity observed 
(in units of $kA^2$).

\textbf{Options:}

A. I--Q, II--R, III--S, IV--P  
B. I--P, II--Q, III--R, IV--T  
C. I--P, II--Q, III--T, IV--S  
D. I--Q, II--P, III--R, IV--T  
```

## Testing and Preview

Visit `/latex-test` in your application to:
1. See live examples of all LaTeX features
2. Test your own LaTeX code in the Custom Input tab
3. View rendered output in real-time
4. Learn from the provided examples

## Implementation Details

### Component Props

```tsx
interface LatexRendererProps {
  content: string;      // LaTeX content to render
  className?: string;   // Optional CSS classes
  displayMode?: boolean; // Force display mode for all math (default: false)
}
```

### Rendering Engine

- **Primary**: KaTeX (fast, synchronous rendering)
- **Fallback**: MathJax (for complex expressions KaTeX cannot handle)
- Math expressions are rendered in parallel for optimal performance

### Security Notes

- The renderer uses `trust: true` in KaTeX to support advanced features
- Content should come from trusted sources only
- Non-math text is HTML-escaped for security

## Common Use Cases

### Test Questions with Math
```tsx
<LatexRenderer content={questionText} />
```

### Solution Steps
```tsx
<LatexRenderer 
  content="Step 1: Apply the formula $F = ma$ where $m = 5kg$ and $a = 2m/s^2$"
  className="text-lg"
/>
```

### Matching Questions
```tsx
<LatexRenderer content={`
\\textbf{Match the following:}

\\twocolumn{
\\textbf{Column A}
A. Item 1
B. Item 2
}{
\\textbf{Column B}
P. Match 1
Q. Match 2
}
`} />
```

## Limitations

- TikZ diagrams are not supported
- Some very complex LaTeX packages may not work
- Nested `\twocolumn` commands are not supported
- Escaped delimiters (e.g., `\$5`) may be incorrectly parsed as math

## Tips and Best Practices

1. **Use `\text{...}`** inside math mode for plain text
2. **Use `\dfrac{}`** instead of `\frac{}` for display-style fractions in inline math
3. **Test your LaTeX** in the `/latex-test` page before using in production
4. **Keep it simple** - avoid overly complex nested structures
5. **Use arrays** for tabular data with mathematical content
6. **Use `\twocolumn`** for simple text columns without borders

## Troubleshooting

### Math not rendering
- Check that you've used correct delimiters: `$...$` or `$$...$$`
- Ensure braces are balanced: every `{` has a matching `}`

### Text commands not working
- Make sure to use `\text{...}` inside math mode
- Use text commands (`\textbf{}`, etc.) outside math mode

### Column layout issues
- For `\twocolumn{}{}`, ensure both columns have their content in `{}`
- For arrays, check that `&` and `\\` are used correctly

## Additional Resources

- [KaTeX Documentation](https://katex.org/docs/supported.html)
- [LaTeX Math Symbols](https://www.cmor-faculty.rice.edu/~heinken/latex/symbols.pdf)
- Test page in your application: `/latex-test`

## Support

For issues or questions about LaTeX rendering, refer to the test page at `/latex-test` which includes comprehensive examples and documentation.
